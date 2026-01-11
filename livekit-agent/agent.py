"""
LiveKit Interview Agent
Real-time voice AI interviewer using Deepgram STT, ElevenLabs TTS, and Groq LLM.
Monitors candidate silence and provides proactive nudges.
"""

import asyncio
import difflib
import json
import logging
import os
import random
import time
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

from livekit import agents, rtc
from livekit.agents import AgentSession, Agent, function_tool, RunContext
from livekit.plugins import deepgram, silero, openai, groq

try:
    from livekit.plugins import elevenlabs
    # Check both possible env var names
    USE_ELEVENLABS = bool(os.getenv("ELEVEN_API_KEY") or os.getenv("ELEVENLABS_API_KEY"))
except ImportError:
    USE_ELEVENLABS = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("interview-agent")

# Problem pool for random selection per session
PROBLEMS = [
    {
        "name": "Two Sum",
        "difficulty": "Easy",
        "description": "Given an array of integers and a target sum, find two numbers that add up to the target. Return their indices.",
        "expected_approach": "Use a hash map to store seen numbers. For each element, check if (target - current) exists.",
    },
    {
        "name": "Valid Parentheses",
        "difficulty": "Easy",
        "description": "Given a string containing just '(', ')', '{', '}', '[' and ']', determine if the input string has valid bracket matching.",
        "expected_approach": "Use a stack. Push opening brackets, pop on closing and verify match. Stack should be empty at end.",
    },
    {
        "name": "Maximum Subarray",
        "difficulty": "Medium",
        "description": "Find the contiguous subarray with the largest sum. This is known as Kadane's algorithm.",
        "expected_approach": "Kadane's algorithm: maintain currentSum and maxSum. At each element, currentSum = max(element, currentSum + element).",
    },
]


def compute_code_diff(old_code: str, new_code: str) -> dict:
    """Detects if code change is significant enough to comment on."""
    if not old_code.strip():
        return {"type": "initial", "significant": len(new_code.strip()) > 30}
    
    old_lines = old_code.strip().split('\n')
    new_lines = new_code.strip().split('\n')
    
    diff = list(difflib.unified_diff(old_lines, new_lines, lineterm=''))
    added = sum(1 for line in diff if line.startswith('+') and not line.startswith('+++'))
    removed = sum(1 for line in diff if line.startswith('-') and not line.startswith('---'))
    
    total_lines = max(len(old_lines), len(new_lines), 1)
    change_percentage = (added + removed) / total_lines
    is_drastic = change_percentage > 0.4 or (removed > 5 and added > 5)
    
    return {"type": "drastic_change" if is_drastic else "incremental", "significant": is_drastic}


def get_code_context(code: str, max_lines: int = 30) -> str:
    """Truncates code for LLM context window efficiency."""
    if not code.strip():
        return "(No code written yet)"
    lines = code.strip().split('\n')
    if len(lines) <= max_lines:
        return code.strip()
    return f"... (last {max_lines} lines)\n" + '\n'.join(lines[-max_lines:])


def get_interviewer_prompt(problem: dict) -> str:
    """System prompt defining Sarah the interviewer's persona and guidelines."""
    return f"""You are Sarah, a friendly technical interviewer at a top tech company.

## Style
- Warm, encouraging, professional
- Ask probing questions about thought process
- Give hints when stuck, NEVER give away answers
- Keep responses SHORT (1-3 sentences max)

## Problem: {problem['name']} ({problem['difficulty']})
{problem['description']}

## Your Tools
You have access to these tools to help with the interview:
- `get_current_code`: Call this to see the candidate's current code when they ask about it
- `analyze_code_approach`: Call this to analyze their code structure and approach

Use these tools when the candidate asks about their code or wants feedback.

## Solution (FOR YOUR GUIDANCE ONLY - NEVER REVEAL)
{problem['expected_approach']}

## Important
- NEVER write code for them
- Keep responses to 2-3 sentences
- Be supportive"""


selected_problem = random.choice(PROBLEMS)


class InterviewerAgent(Agent):
    """Agent with state for tracking code and activity timing."""
    
    def __init__(self) -> None:
        super().__init__(instructions=get_interviewer_prompt(selected_problem))
        self.current_code = ""
        self.previous_code = ""
        self.last_code_comment_time = 0
        self.last_user_activity_time = time.time()
        self.last_nudge_time = time.time()
    
    def update_code_context(self, code: str):
        """Updates agent's current code state."""
        self.current_code = code
        logger.info(f"[CODE_SYNC] Updated code ({len(code)} chars)")
    
    @function_tool()
    async def get_current_code(
        self,
        context: RunContext,
        include_line_numbers: bool = False,
    ) -> str:
        """
        Retrieve the candidate's current code from the editor.
        Call this when you need to see what the candidate has written,
        or when they ask you to review their code.
        
        Args:
            include_line_numbers: Whether to include line numbers in the output (default: False)
        
        Returns:
            The current code in the candidate's editor.
        """
        if not self.current_code.strip():
            return "(No code written yet)"
        code = get_code_context(self.current_code)
        if include_line_numbers:
            lines = code.split('\n')
            code = '\n'.join(f"{i+1}: {line}" for i, line in enumerate(lines))
        return code
    
    @function_tool()
    async def analyze_code_approach(
        self,
        context: RunContext,
        check_complexity: bool = False,
    ) -> dict:
        """
        Analyze the candidate's current code to understand their approach.
        Call this when you want to evaluate their solution strategy.
        
        Args:
            check_complexity: Whether to include complexity analysis (default: False)
        
        Returns:
            Analysis of the code including line count and basic structure info.
        """
        code = self.current_code
        if not code.strip():
            return {"status": "no_code", "message": "Candidate hasn't written any code yet"}
        
        lines = code.strip().split('\n')
        has_function = any('def ' in line or 'function ' in line for line in lines)
        has_loop = any(keyword in code for keyword in ['for ', 'while ', 'forEach', '.map('])
        has_conditional = any(keyword in code for keyword in ['if ', 'else:', 'else {'])
        
        result = {
            "status": "has_code",
            "line_count": len(lines),
            "has_function_definition": has_function,
            "has_loop": has_loop,
            "has_conditional": has_conditional,
            "code_preview": get_code_context(code, max_lines=15)
        }
        
        if check_complexity:
            result["estimated_complexity"] = "O(n^2)" if has_loop and code.count('for ') > 1 else "O(n)"
        
        return result
    
    async def on_user_turn_completed(self, turn_ctx, new_message):
        """
        Called after user finishes speaking, before LLM generates response.
        Injects current code context into the user's message for real-time awareness.
        """
        # Only inject if we have code and user is asking about it
        if self.current_code.strip():
            code_context = f"\n\n[CURRENT CODE IN EDITOR]\n```\n{get_code_context(self.current_code)}\n```"
            
            # Append code context to the user's message
            if hasattr(new_message, 'content') and isinstance(new_message.content, str):
                new_message.content += code_context
                logger.info("[CODE_SYNC] Injected code context into user turn")
        
        # Call parent to continue normal flow
        return await super().on_user_turn_completed(turn_ctx, new_message)


_interviewer_agent: Optional[InterviewerAgent] = None


async def handle_code_update(code: str, session: AgentSession, agent: InterviewerAgent):
    """Updates agent with current code and optionally comments on significant changes."""
    agent.previous_code = agent.current_code
    agent.update_code_context(code)  # Always sync code to agent instructions
    agent.last_user_activity_time = time.time()
    
    diff_info = compute_code_diff(agent.previous_code, code)
    current_time = time.time()
    
    if diff_info['significant'] and (current_time - agent.last_code_comment_time) > 30:
        agent.last_code_comment_time = current_time
        prompt = f"""The candidate made a significant code change.

Code:
```
{get_code_context(code)}
```

Ask briefly about their approach (1-2 sentences)."""
        
        try:
            await session.generate_reply(instructions=prompt)
        except Exception as e:
            logger.error(f"Error generating code response: {e}")


async def check_silence_and_nudge(session: AgentSession, agent: InterviewerAgent):
    """
    Proactively nudges silent candidates.
    Uses session.say() for reliable speech output from async context.
    """
    SILENCE_THRESHOLD = 45
    NUDGE_COOLDOWN = 45
    
    NUDGE_MESSAGES = [
        "I notice you've been quiet for a bit. Would you like to talk through your approach?",
        "Take your time, but feel free to think out loud if it helps.",
        "I'm here if you have any questions or want to discuss your solution.",
        "No pressure, but sharing your thought process can help me give you better feedback.",
    ]
    nudge_index = 0
    
    while True:
        await asyncio.sleep(20)
        
        if not agent:
            continue
            
        current_time = time.time()
        time_since_activity = current_time - agent.last_user_activity_time
        time_since_nudge = current_time - agent.last_nudge_time
        
        if time_since_activity > SILENCE_THRESHOLD and time_since_nudge > NUDGE_COOLDOWN:
            agent.last_nudge_time = current_time
            message = NUDGE_MESSAGES[nudge_index % len(NUDGE_MESSAGES)]
            nudge_index += 1
            
            try:
                await session.say(message, allow_interruptions=True)
            except Exception as e:
                logger.error(f"Error saying nudge: {e}")


async def entrypoint(ctx: agents.JobContext):
    """Main entry point - sets up session, handlers, and starts interview."""
    global _interviewer_agent
    
    logger.info(f"Starting interview. Problem: {selected_problem['name']}")
    
    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()
    logger.info(f"Candidate connected: {participant.identity}")
    
    # AI pipeline: STT -> LLM -> TTS
    stt = deepgram.STT(model="nova-2", language="en")
    eleven_key = os.getenv("ELEVEN_API_KEY") or os.getenv("ELEVENLABS_API_KEY")
    tts = elevenlabs.TTS(api_key=eleven_key, voice_id="EXAVITQu4vr4xnSDxMaL") if USE_ELEVENLABS else openai.TTS(voice="nova")
    llm = groq.LLM(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
    )
    
    _interviewer_agent = InterviewerAgent()
    
    session = AgentSession(
        stt=stt,
        llm=llm,
        tts=tts,
        vad=silero.VAD.load(),
    )
    
    # Activity tracking: reset timer on user/agent speech
    @session.on("user_input_transcribed")
    def on_user_speech(event):
        _interviewer_agent.last_user_activity_time = time.time()
    
    @session.on("agent_speech_committed")
    def on_agent_speech(message):
        _interviewer_agent.last_user_activity_time = time.time()
    
    await session.start(room=ctx.room, agent=_interviewer_agent)
    
    # Background task for silence detection
    silence_task = asyncio.create_task(check_silence_and_nudge(session, _interviewer_agent))
    
    # Initial greeting
    await session.generate_reply(
        instructions=f"Greet the candidate and present this problem: {selected_problem['description']}. Ask if they have questions."
    )
    
    # Handle code updates from frontend data channel
    @ctx.room.on("data_received")
    def on_data_received(packet: rtc.DataPacket):
        try:
            data = json.loads(packet.data.decode("utf-8"))
            if data.get("type") == "code_update":
                code = data.get("code", "")
                if len(code.strip()) > 20:
                    asyncio.create_task(handle_code_update(code, session, _interviewer_agent))
        except Exception as e:
            logger.error(f"Error processing data: {e}")
    
    try:
        await asyncio.Future()  # Keep running
    except asyncio.CancelledError:
        pass
    finally:
        silence_task.cancel()


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))

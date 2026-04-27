from fastapi import FastAPI, HTTPException
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled
import re

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


def extract_video_id(url: str) -> str | None:
    patterns = [
        r"youtu\.be/([^?&]+)",
        r"youtube\.com/watch\?v=([^&]+)",
        r"youtube\.com/shorts/([^?&]+)",
        r"youtube\.com/embed/([^?&]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


@app.get("/transcript")
def get_transcript(url: str, language: str = "en"):
    video_id = extract_video_id(url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Cannot extract video ID from URL")

    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        try:
            transcript = transcript_list.find_transcript([language])
        except NoTranscriptFound:
            try:
                transcript = transcript_list.find_transcript(["en"])
            except NoTranscriptFound:
                transcript = transcript_list.find_generated_transcript(
                    [t.language_code for t in transcript_list]
                )

        data = transcript.fetch()
        full_text = " ".join(entry["text"] for entry in data)
        return {
            "video_id": video_id,
            "full_text": full_text,
            "language": transcript.language_code,
            "source": "captions",
        }

    except TranscriptsDisabled:
        return {
            "video_id": video_id,
            "full_text": "",
            "language": language,
            "source": "none",
            "error": "Transcripts disabled for this video",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

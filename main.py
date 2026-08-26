from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import yt_dlp
import uvicorn
import urllib.request
import urllib.parse

app = FastAPI(title="Music Streamer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SEARCH ENDPOINT ---
@app.get("/api/search")
def search_songs(query: str):
    ydl_opts = {
        'extract_flat': True, 
        'quiet': True
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            music_query = f"{query} song audio"
            info = ydl.extract_info(f"ytsearch10:{music_query}", download=False)
            results = []
            
            for entry in info.get('entries', []):
                if not entry:
                    continue
                video_id = entry.get("id")
                results.append({
                    "title": entry.get("title", "Unknown Title"),
                    "artist": entry.get("uploader", "Unknown Artist"),
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
                })
                
            return {"results": results}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

# --- AUDIO METADATA ENDPOINT ---
@app.get("/api/stream")
def get_audio_stream(query: str):
    ydl_opts = {
        'format': 'bestaudio/best',
        'noplaylist': True,
        'quiet': True,
        'extractor_args': {'youtube': ['player_client=mweb,web']}
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(query, download=False)
            if 'entries' in info:
                info = info['entries'][0]

            raw_stream_url = info.get("url")
            # Redirect stream output through our backend proxy
            proxied_url = f"/api/proxy?url={urllib.parse.quote(raw_stream_url)}"

            return {
                "title": info.get("title"),
                "artist": info.get("uploader"),
                "stream_url": proxied_url
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

# --- AUDIO STREAM PROXY ---
@app.get("/api/proxy")
def proxy_audio(url: str):
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        res = urllib.request.urlopen(req)
        
        def stream_chunks():
            while chunk := res.read(1024 * 64):
                yield chunk

        return StreamingResponse(stream_chunks(), media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
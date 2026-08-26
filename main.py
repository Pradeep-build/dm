from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import yt_dlp
import uvicorn
import requests
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
            proxied_url = f"/api/proxy?url={urllib.parse.quote(raw_stream_url)}"

            return {
                "title": info.get("title"),
                "artist": info.get("uploader"),
                "stream_url": proxied_url
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

# --- RANGE-AWARE AUDIO PROXY ---
@app.get("/api/proxy")
def proxy_audio(url: str, request: Request):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }
    
    # Forward range header from browser request if present
    range_header = request.headers.get("range")
    if range_header:
        headers["Range"] = range_header

    try:
        req = requests.get(url, headers=headers, stream=True)
        
        response_headers = {
            "Content-Type": req.headers.get("Content-Type", "audio/mpeg"),
            "Content-Length": req.headers.get("Content-Length", ""),
            "Content-Range": req.headers.get("Content-Range", ""),
            "Accept-Ranges": "bytes",
        }
        # Filter out empty headers
        response_headers = {k: v for k, v in response_headers.items() if v}

        return StreamingResponse(
            req.iter_content(chunk_size=64 * 1024),
            status_code=req.status_code,
            headers=response_headers,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
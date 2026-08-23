from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import uvicorn

app = FastAPI(title="Music Streamer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FAST SEARCH (Top 10 Music Results with Thumbnails) ---
@app.get("/api/search")
def search_songs(query: str):
    ydl_opts = {
        'extract_flat': True, 
        'quiet': True
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            music_query = f"{query} song audio"
            # Increased search count to 10
            info = ydl.extract_info(f"ytsearch10:{music_query}", download=False)
            
            results = []
            
            for entry in info.get('entries', []):
                if not entry:
                    continue
                
                video_id = entry.get("id")
                video_url = f"https://www.youtube.com/watch?v={video_id}"
                # High-resolution thumbnail fallback
                thumbnail_url = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
                
                results.append({
                    "title": entry.get("title", "Unknown Title"),
                    "artist": entry.get("uploader", "Unknown Artist"),
                    "url": video_url,
                    "thumbnail": thumbnail_url
                })
                
            return {"results": results}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))


# --- AUDIO STREAM EXTRACTOR ---
@app.get("/api/stream")
def get_audio_stream(query: str):
    ydl_opts = {
        'format': 'bestaudio/best',
        'noplaylist': True,
        'quiet': True
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(query, download=False)
            if 'entries' in info:
                info = info['entries'][0]

            return {
                "title": info.get("title"),
                "artist": info.get("uploader"),
                "stream_url": info.get("url")
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
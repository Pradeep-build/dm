'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AudioLines,
  ChevronDown,
  Heart,
  MoreHorizontal,
  Pause,
  Play,
  Repeat2,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react'

type Track = {
  title: string
  artist: string
  url: string
  thumbnail: string
}

const fallback: Track[] = [
  { title: 'Midnight City', artist: 'M83', url: 'midnight city', thumbnail: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=240&q=80' },
  { title: 'Space Song', artist: 'Beach House', url: 'space song', thumbnail: 'https://images.unsplash.com/photo-1534791547706-7b57566a071a?w=240&q=80' },
  { title: 'Intro', artist: 'The xx', url: 'intro the xx', thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=240&q=80' },
  { title: 'Sunset Lover', artist: 'Petit Biscuit', url: 'sunset lover', thumbnail: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=240&q=80' },
]

export default function Page() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Track[]>(fallback)
  const [current, setCurrent] = useState<Track>(fallback[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.75)
  const [loading, setLoading] = useState(false)

  // 1. Audio Element Event Listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const update = () => setProgress(audio.currentTime)
    const loaded = () => setDuration(audio.duration || 0)
    audio.addEventListener('timeupdate', update)
    audio.addEventListener('loadedmetadata', loaded)
    audio.addEventListener('ended', () => setIsPlaying(false))
    return () => {
      audio.removeEventListener('timeupdate', update)
      audio.removeEventListener('loadedmetadata', loaded)
    }
  }, [])

  // 2. Volume Control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // 3. Media Session API for Background Playback & Lockscreen Controls
  useEffect(() => {
    if ('mediaSession' in navigator && current) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: 'DeTA MUSIC',
        artwork: [
          { src: current.thumbnail, sizes: '512x512', type: 'image/jpeg' },
          { src: current.thumbnail, sizes: '512x512', type: 'image/png' }
        ]
      })

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) {
          audioRef.current.play()
          setIsPlaying(true)
        }
      })

      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) {
          audioRef.current.pause()
          setIsPlaying(false)
        }
      })
      
      // You can also add 'previoustrack' and 'nexttrack' handlers here 
      // when you implement skipping logic.
    }
  }, [current])

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`)
      const data = await response.json()
      setResults(data.results || [])
      
      const resultsSection = document.getElementById('results-section')
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' })
      }
    } catch {
      setResults(fallback.filter((track) => `${track.title} ${track.artist}`.toLowerCase().includes(query.toLowerCase())))
    } finally { 
      setLoading(false) 
    }
  }

  async function playTrack(track: Track) {
    setCurrent(track)
    try {
      const response = await fetch(`http://localhost:8000/api/stream?query=${encodeURIComponent(track.url)}`)
      const data = await response.json()
      if (data.stream_url && audioRef.current) {
        audioRef.current.src = data.stream_url
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch {
      setIsPlaying(false)
    }
  }

  function togglePlay() {
    const audio = audioRef.current
    if (!audio?.src) return
    if (audio.paused) { 
      audio.play(); 
      setIsPlaying(true) 
    } else { 
      audio.pause(); 
      setIsPlaying(false) 
    }
  }

  const format = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

  return (
    <main className="min-h-screen bg-background text-foreground">
      <audio ref={audioRef} className="hidden" />
      <div className="flex min-h-screen">
        <section className="min-w-0 flex-1 pb-32">
          
          <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-background/90 px-5 py-5 backdrop-blur-xl md:px-10">
            <div className="flex items-center gap-3 pr-4 md:pr-8">
              <div className="grid size-9 min-w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <AudioLines size={20} />
              </div>
              <span className="hidden font-mono text-sm font-bold tracking-[0.2em] sm:block">DeTA MUSIC</span>
            </div>

            <div className="relative max-w-xl flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    search()
                  }
                }} 
                placeholder="Search songs, artists, albums..." 
                className="h-11 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none transition focus:border-primary" 
              />
            </div>
          </header>
          
          <div className="mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-12">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Good evening</p>
                <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">Find your next<br className="hidden md:block" /> favorite sound.</h1>
              </div>
              <button onClick={search} className="hidden rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 sm:block">
                {loading ? 'Searching...' : 'Search library'}
              </button>
            </div>
            
            <section id="results-section" className="mt-12" aria-labelledby="results-title">
              <div className="mb-5 flex items-center justify-between">
                <h2 id="results-title" className="text-lg font-semibold">{query ? `Results for “${query}”` : 'Recently played'}</h2>
                <button className="text-xs font-medium text-muted-foreground hover:text-foreground">View history</button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-card/50">
                <div className="hidden grid-cols-[2.5rem_1fr_1fr_auto] gap-4 border-b border-border px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:grid"><span>#</span><span>Track</span><span>Artist</span><span /></div>
                {results.length ? results.map((track, i) => (
                  <button key={`${track.title}-${i}`} onClick={() => playTrack(track)} className={`grid w-full grid-cols-[2rem_1fr_auto] items-center gap-3 px-4 py-3 text-left transition hover:bg-secondary sm:grid-cols-[2.5rem_1fr_1fr_auto] sm:gap-4 sm:px-5 ${current.title === track.title ? 'bg-secondary/70' : ''}`}>
                    <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex min-w-0 items-center gap-3">
                      <img src={track.thumbnail} alt="" className="size-11 rounded-lg object-cover" />
                      <span className="min-w-0"><span className="block truncate text-sm font-medium">{track.title}</span><span className="block truncate text-xs text-muted-foreground sm:hidden">{track.artist}</span></span>
                    </span>
                    <span className="hidden truncate text-sm text-muted-foreground sm:block">{track.artist}</span>
                    <span className="text-muted-foreground">{current.title === track.title && isPlaying ? <AudioLines size={17} className="text-primary" /> : <MoreHorizontal size={18} />}</span>
                  </button>
                )) : <p className="p-8 text-center text-sm text-muted-foreground">No tracks found. Try another search.</p>}
              </div>
            </section>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 shadow-2xl backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:w-1/4 md:flex-none">
            <img src={current.thumbnail} alt={`${current.title} artwork`} className="size-12 rounded-xl object-cover" />
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{current.title}</p><p className="truncate text-xs text-muted-foreground">{current.artist}</p></div>
            <button className="ml-1 hidden text-muted-foreground hover:text-primary sm:block" aria-label="Like"><Heart size={17} /></button>
          </div>
          <div className="flex items-center gap-4 md:flex-1 md:flex-col md:gap-1">
            <div className="flex items-center gap-5">
              <button className="hidden text-muted-foreground hover:text-foreground sm:block" aria-label="Shuffle"><Shuffle size={16} /></button>
              <button className="hidden text-muted-foreground hover:text-foreground sm:block" aria-label="Previous"><SkipBack size={19} fill="currentColor" /></button>
              <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'} className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground transition hover:scale-105">{isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}</button>
              <button className="hidden text-muted-foreground hover:text-foreground sm:block" aria-label="Next"><SkipForward size={19} fill="currentColor" /></button>
              <button className="hidden text-muted-foreground hover:text-foreground sm:block" aria-label="Repeat"><Repeat2 size={16} /></button>
            </div>
            <div className="hidden w-full max-w-xl items-center gap-3 md:flex">
              <span className="font-mono text-[10px] text-muted-foreground">{format(progress)}</span>
              <input aria-label="Song progress" type="range" min="0" max={duration || 100} value={progress} onChange={(e) => { const value = Number(e.target.value); setProgress(value); if (audioRef.current) audioRef.current.currentTime = value }} className="h-1 flex-1 accent-primary" />
              <span className="font-mono text-[10px] text-muted-foreground">{format(duration)}</span>
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex md:w-1/4 md:justify-end">
            <Volume2 size={17} className="text-muted-foreground" />
            <input 
              aria-label="Volume control" 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume} 
              onChange={(e) => setVolume(Number(e.target.value))} 
              className="h-1 w-20 cursor-pointer accent-primary" 
            />
            <ChevronDown size={18} className="text-muted-foreground" />
          </div>
        </div>
      </div>
    </main>
  )
}
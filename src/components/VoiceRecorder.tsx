import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Upload, RotateCcw } from 'lucide-react';

interface VoiceRecorderProps {
  audioUrl?: string;
  audioDuration?: number;
  onSaveAudio: (dataUrl: string, duration: number) => void;
  onDeleteAudio: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  audioUrl,
  audioDuration = 0,
  onSaveAudio,
  onDeleteAudio,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up timer and recorder on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Start recording
  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung perekaman audio.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onSaveAudio(base64Audio, recordingSeconds);
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      const startTime = Date.now();
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds(Math.round((Date.now() - startTime) / 1000));
      }, 500);
    } catch (err) {
      console.error('Mic recording error:', err);
      setErrorMsg('Gagal mengakses mikrofon. Pastikan izin mikrofon telah diberikan.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Toggle playback
  const togglePlay = () => {
    const audio = audioElRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Play error:', e));
    }
  };

  // Handle local audio file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const tempAudio = new Audio(dataUrl);
      tempAudio.onloadedmetadata = () => {
        const dur = Math.round(tempAudio.duration) || 0;
        onSaveAudio(dataUrl, dur);
      };
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioElRef}
          src={audioUrl}
          onTimeUpdate={() => {
            if (audioElRef.current) {
              setCurrentTime(Math.round(audioElRef.current.currentTime));
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
          {errorMsg}
        </div>
      )}

      {/* State 1: Active Recording in Progress */}
      {isRecording ? (
        <div className="flex flex-col items-center justify-center gap-3 py-4 bg-white rounded-lg border border-rose-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider font-mono">
              Merekam Suara...
            </span>
          </div>

          <div className="font-mono text-2xl font-bold text-slate-800 tabular-nums">
            {formatTime(recordingSeconds)}
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Berhenti &amp; Simpan</span>
          </button>
        </div>
      ) : audioUrl ? (
        /* State 2: Audio Recorded & Ready to Play */
        <div className="flex flex-col gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play / Pause button */}
              <button
                type="button"
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-xs transition-transform active:scale-95"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              <div>
                <div className="font-semibold text-xs text-slate-800">
                  Voice Memo
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {formatTime(currentTime)} / {formatTime(audioDuration || (audioElRef.current?.duration ? Math.round(audioElRef.current.duration) : 0))}
                </div>
              </div>
            </div>

            {/* Sound wave visual bars */}
            <div className="flex items-center gap-1 h-6">
              {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50].map((height, i) => (
                <div
                  key={i}
                  style={{ height: isPlaying ? `${height}%` : '25%' }}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isPlaying ? 'bg-slate-800 animate-pulse' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Action buttons: Re-record, Delete, or Upload new */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rekam Ulang</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isPlaying) togglePlay();
                onDeleteAudio();
              }}
              className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Voice</span>
            </button>
          </div>
        </div>
      ) : (
        /* State 3: Ready to Record or Upload */
        <div className="flex flex-col items-center justify-center gap-3 py-4 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-xs transition-all hover:scale-102 active:scale-98"
          >
            <Mic className="w-4 h-4" />
            <span>Mulai Rekam Suara</span>
          </button>

          <span className="text-[11px] text-slate-400">atau</span>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium border border-slate-200 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload Berkas Audio</span>
          </button>
        </div>
      )}

      {/* Hidden file input for uploading audio files */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="audio/*"
        className="hidden"
      />
    </div>
  );
};

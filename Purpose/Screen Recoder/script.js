"use strict";
class ScreenRecorderApp {
  constructor() {
    this.btnRecord = document.getElementById("btnRecord");
    this.btnSave = document.getElementById("btnSave");
    this.statusEl = document.getElementById("status");
    this.videoEl = document.getElementById("preview");
    this.hintEl = document.getElementById("hint");
    this.stream = null;
    this.recorder = null;
    this.chunks = [];
    this.recordedBlob = null;
    this.objectUrl = null;
    this.isRecording = false;
    this.onRecordClick = this.onRecordClick.bind(this);
    this.onSaveClick = this.onSaveClick.bind(this);
    this.btnRecord.addEventListener("click", this.onRecordClick);
    this.btnSave.addEventListener("click", this.onSaveClick);
    this.setStatus("Idle.");
    this.setSaveEnabled(false);
  }
  setStatus(msg) {
    this.statusEl.textContent = msg;
  }
  setSaveEnabled(enabled) {
    this.btnSave.disabled = !enabled;
  }
  showPreview(show) {
    this.videoEl.style.display = show ? "block" : "none";
    this.hintEl.style.display = show ? "none" : "block";
  }
  supportsScreenCapture() {
    return !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === "function");
  }
  isSecureContextOk() {
    return window.isSecureContext || location.hostname === "localhost" || location.hostname === "127.0.0.1";
  }
  pickBestMimeType() {
    const candidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm"
    ];
    if (!window.MediaRecorder || typeof MediaRecorder.isTypeSupported !== "function") {
      return "";
    }
    return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || "";
  }
  async onRecordClick() {
    if (this.isRecording) {
      this.setStatus("Stopping…");
      this.stopRecording();
      return;
    }
    if (!this.isSecureContextOk()) {
      alert("Screen recording requires HTTPS (or localhost).");
      return;
    }
    if (!this.supportsScreenCapture()) {
      alert("This browser does not support screen recording. Use Chrome or Edge.");
      return;
    }
    try {
      this.resetRecording();
      this.setStatus("Requesting permission…");
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      const [videoTrack] = this.stream.getVideoTracks();
      if (videoTrack) {
        videoTrack.addEventListener("ended", () => {
          if (this.isRecording) this.stopRecording();
        });
      }
      const mimeType = this.pickBestMimeType();
      this.recorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
      this.chunks = [];
      this.recorder.addEventListener("dataavailable", (e) => {
        if (e.data && e.data.size > 0) this.chunks.push(e.data);
      });
      this.recorder.addEventListener("stop", () => this.onRecorderStop());
      this.recorder.addEventListener("error", (e) => {
        console.error("MediaRecorder error:", e);
        this.setStatus("Recording error. See console for details.");
      });
      this.recorder.start(); 
      this.isRecording = true;
      this.btnRecord.textContent = "Recording… (Stop Sharing to Finish)";
      this.btnRecord.style.background = "var(--danger)";
      this.setStatus("Recording. Use the browser sharing bar to stop sharing.");
      this.showPreview(false);
      this.setSaveEnabled(false);
    } catch (err) {
      const msg = this.humanizeGetDisplayMediaError(err);
      alert(msg);
      this.setStatus("Idle.");
      this.cleanupStream();
    }
  }
  stopRecording() {
    try {
      if (this.recorder && this.recorder.state !== "inactive") {
        this.recorder.stop();
      } else {
        this.onRecorderStop();
      }
    } catch (e) {
      console.error("Stop error:", e);
      this.onRecorderStop();
    }
  }
  onRecorderStop() {
    this.isRecording = false;
    this.cleanupStream();
    if (this.chunks.length) {
      const type = this.chunks[0].type || "video/webm";
      this.recordedBlob = new Blob(this.chunks, { type });
      this.setStatus(`Recording ready (${this.formatBytes(this.recordedBlob.size)}).`);
      this.attachPreview(this.recordedBlob);
      this.setSaveEnabled(true);
    } else {
      this.setStatus("No data recorded.");
      this.setSaveEnabled(false);
      this.showPreview(false);
    }
    this.btnRecord.textContent = "Start Recording";
    this.btnRecord.style.background = "";
  }
  attachPreview(blob) {
    this.revokeObjectUrl();
    this.objectUrl = URL.createObjectURL(blob);
    this.videoEl.src = this.objectUrl;
    this.videoEl.load();
    this.showPreview(true);
  }
  onSaveClick() {
    if (!this.recordedBlob) return;
    const ext = this.recordedBlob.type.includes("webm") ? "webm" : "mp4";
    const filename = `screen-recording-${this.timestamp()}.${ext}`;
    this.downloadBlob(this.recordedBlob, filename);
  }
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  resetRecording() {
    this.chunks = [];
    this.recordedBlob = null;
    this.setSaveEnabled(false);
    this.revokeObjectUrl();
  }
  revokeObjectUrl() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
  cleanupStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
  humanizeGetDisplayMediaError(err) {
    const name = err && err.name ? err.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return "Permission denied. Please allow screen capture and try again.";
    }
    if (name === "NotFoundError") {
      return "No screen/window source was found to capture.";
    }
    if (name === "NotReadableError") {
      return "The screen source is busy or cannot be read right now. Try closing other capture apps.";
    }
    if (name === "AbortError") {
      return "Screen capture was cancelled.";
    }
    return `Unable to start screen recording. ${name ? `(${name})` : ""}`;
  }
  timestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(
      d.getMinutes()
    )}${pad(d.getSeconds())}`;
  }
  formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new ScreenRecorderApp();
});
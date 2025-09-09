// Global media manager to handle multiple audio/video playback
class MediaManager {
  constructor() {
    this.currentlyPlaying = null;
    this.registeredMedias = new Set();
  }

  // Register a media element (audio or video)
  register(mediaElement, id) {
    this.registeredMedias.add({ element: mediaElement, id });
  }

  // Unregister a media element
  unregister(id) {
    this.registeredMedias.forEach(media => {
      if (media.id === id) {
        this.registeredMedias.delete(media);
      }
    });
  }

  // Play a media and pause all others
  play(mediaElement, id) {
    // Pause all other media
    this.registeredMedias.forEach(media => {
      if (media.element !== mediaElement && !media.element.paused) {
        media.element.pause();
      }
    });
    
    // Set current playing
    this.currentlyPlaying = { element: mediaElement, id };
  }

  // Handle when media is paused
  pause(mediaElement, id) {
    if (this.currentlyPlaying?.id === id) {
      this.currentlyPlaying = null;
    }
  }

  // Handle when media ends
  ended(mediaElement, id) {
    if (this.currentlyPlaying?.id === id) {
      this.currentlyPlaying = null;
    }
  }

  // Get currently playing media
  getCurrentlyPlaying() {
    return this.currentlyPlaying;
  }
}

// Create global instance
const mediaManager = new MediaManager();

export default mediaManager;
// Message helpers and schema (plain JS, JSDoc annotated)

/**
 * @typedef {Object} ImageMeta
 * @property {string} url
 * @property {number} width
 * @property {number} height
 * @property {File|Blob=} file
 */

export const MessageType = {
  TEXT: "text",
  IMAGE: "image",
  IMAGE_GROUP: "image_group",
  AUDIO: "audio",
  VIDEO: "video",
  FILE: "file",
  SYSTEM: "system",
};

export function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function base(from = "me") {
  return { 
    id: newId(), 
    from, 
    ts: Date.now(), 
    is_read: from === "me" // User's own messages are always read, others default to unread
  };
}

export function makeText({ text, from = "me" }) {
  return { ...base(from), type: MessageType.TEXT, content: text };
}

export function makeImage({ image, caption = "", from = "me" }) {
  // image: { url, width, height }
  return {
    ...base(from),
    type: MessageType.IMAGE,
    content: image.url,
    caption,
    meta: { width: image.width, height: image.height },
  };
}

export function makeImageGroup({ images, caption = "", from = "me" }) {
  // images: Array<ImageMeta>
  return { ...base(from), type: MessageType.IMAGE_GROUP, images, caption };
}

export function makeAudio({ url, mediaId, duration, from = "me" }) {
  return { 
    ...base(from), 
    type: MessageType.AUDIO, 
    content: url || null,
    mediaId,
    meta: { duration } 
  };
}

export function makeVideo({ url, mediaId, width, height, duration, from = "me" }) {
  return {
    ...base(from),
    type: MessageType.VIDEO,
    content: url || null,
    mediaId,
    meta: { width, height, duration },
  };
}

export function makeFile({ file, name, size, type, caption = "", from = "me" }) {
  return {
    ...base(from),
    type: MessageType.FILE,
    content: file,
    name,
    size,
    fileType: type,
    caption
  };
}

export function makeSystem({ text }) {
  return { ...base("system"), type: MessageType.SYSTEM, content: text };
}

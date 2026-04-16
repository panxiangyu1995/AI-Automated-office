/**
 * Remotion ProductStory - Animation utilities
 */
import {
  Easing,
  interpolate,
  spring,
} from 'remotion'

export const appear = (frame: number, fps: number, delayFrames = 0, durationInFrames = 22) =>
  spring({
    frame: frame - delayFrames,
    fps,
    durationInFrames,
    config: { damping: 200 },
  })

export const slideUp = (frame: number, fps: number, delayFrames = 0) =>
  interpolate(appear(frame, fps, delayFrames), [0, 1], [48, 0])

export const fade = (frame: number, fps: number, delayFrames = 0) =>
  interpolate(appear(frame, fps, delayFrames), [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

export const reveal = (
  frame: number,
  start: number,
  end: number,
  easing = Easing.inOut(Easing.cubic),
) =>
  interpolate(frame, [start, end], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

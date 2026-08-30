// קובץ נוצר אוטומטית על ידי scripts/import-videos.mjs — אין לערוך ידנית.
// הרצה מחדש: npm run import:videos

export interface BundledVideo {
  /** נתיב יחסי ל-base של האפליקציה */
  src: string
  poster: string
  width: number
  height: number
  durationSec: number
  sizeBytes: number
}

export const VIDEO_MANIFEST: Record<string, BundledVideo[]> = {
  "pushup": [
    {
      "src": "videos/pushup-01.mp4",
      "poster": "videos/pushup-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.8,
      "sizeBytes": 534177
    }
  ],
  "db-bench-press": [
    {
      "src": "videos/db-bench-press-02.mp4",
      "poster": "videos/db-bench-press-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.1,
      "sizeBytes": 261332
    },
    {
      "src": "videos/db-bench-press-03.mp4",
      "poster": "videos/db-bench-press-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.6,
      "sizeBytes": 308651
    },
    {
      "src": "videos/db-bench-press-04.mp4",
      "poster": "videos/db-bench-press-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.4,
      "sizeBytes": 326219
    }
  ],
  "incline-barbell-bench-press": [
    {
      "src": "videos/db-bench-press-01.mp4",
      "poster": "videos/db-bench-press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.4,
      "sizeBytes": 366971
    }
  ],
  "decline-machine-press": [
    {
      "src": "videos/decline-machine-press-01.mp4",
      "poster": "videos/decline-machine-press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 94.3,
      "sizeBytes": 3693042
    },
    {
      "src": "videos/decline-machine-press-02.mp4",
      "poster": "videos/decline-machine-press-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 47.3,
      "sizeBytes": 2122316
    }
  ],
  "dips": [
    {
      "src": "videos/dips-01.mp4",
      "poster": "videos/dips-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 17.9,
      "sizeBytes": 616643
    }
  ],
  "decline-pec-fly": [
    {
      "src": "videos/decline-pec-fly-01.mp4",
      "poster": "videos/decline-pec-fly-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 108.9,
      "sizeBytes": 4008706
    }
  ],
  "overhead-tricep-ext": [
    {
      "src": "videos/overhead-tricep-ext-01.mp4",
      "poster": "videos/overhead-tricep-ext-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.9,
      "sizeBytes": 462499
    }
  ],
  "cable-tricep-pushdown": [
    {
      "src": "videos/cable-tricep-pushdown-01.mp4",
      "poster": "videos/cable-tricep-pushdown-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 17.4,
      "sizeBytes": 460973
    }
  ],
  "cross-cable-tricep": [
    {
      "src": "videos/cross-cable-tricep-01.mp4",
      "poster": "videos/cross-cable-tricep-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 81.5,
      "sizeBytes": 2708028
    }
  ],
  "machine-shoulder-press": [
    {
      "src": "videos/machine-shoulder-press-01.mp4",
      "poster": "videos/machine-shoulder-press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.1,
      "sizeBytes": 306604
    }
  ],
  "lateral-raise": [
    {
      "src": "videos/lateral-raise-01.mp4",
      "poster": "videos/lateral-raise-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.6,
      "sizeBytes": 188148
    }
  ],
  "lat-pulldown": [
    {
      "src": "videos/lat-pulldown-01.mp4",
      "poster": "videos/lat-pulldown-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.7,
      "sizeBytes": 264296
    },
    {
      "src": "videos/lat-pulldown-02.mp4",
      "poster": "videos/lat-pulldown-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.1,
      "sizeBytes": 215136
    },
    {
      "src": "videos/lat-pulldown-03.mp4",
      "poster": "videos/lat-pulldown-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.1,
      "sizeBytes": 320147
    }
  ],
  "seated-row-heavy": [
    {
      "src": "videos/seated-row-heavy-01.mp4",
      "poster": "videos/seated-row-heavy-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 20.8,
      "sizeBytes": 855991
    }
  ],
  "seated-row-light": [
    {
      "src": "videos/seated-row-light-01.mp4",
      "poster": "videos/seated-row-light-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 92.6,
      "sizeBytes": 3315699
    }
  ],
  "low-row-rack": [
    {
      "src": "videos/low-row-rack-01.mp4",
      "poster": "videos/low-row-rack-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.2,
      "sizeBytes": 387155
    }
  ],
  "preacher-curl": [
    {
      "src": "videos/preacher-curl-01.mp4",
      "poster": "videos/preacher-curl-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.8,
      "sizeBytes": 283210
    },
    {
      "src": "videos/preacher-curl-02.mp4",
      "poster": "videos/preacher-curl-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.6,
      "sizeBytes": 218936
    }
  ],
  "hammer-curl": [
    {
      "src": "videos/hammer-curl-01.mp4",
      "poster": "videos/hammer-curl-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 17.7,
      "sizeBytes": 639705
    }
  ],
  "behind-body-cable-curl": [
    {
      "src": "videos/behind-body-cable-curl-01.mp4",
      "poster": "videos/behind-body-cable-curl-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.2,
      "sizeBytes": 313139
    }
  ],
  "forearm-straight-bar": [
    {
      "src": "videos/forearm-straight-bar-01.mp4",
      "poster": "videos/forearm-straight-bar-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.5,
      "sizeBytes": 346185
    },
    {
      "src": "videos/forearm-straight-bar-02.mp4",
      "poster": "videos/forearm-straight-bar-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 25.3,
      "sizeBytes": 997684
    }
  ],
  "forearm-dumbbell": [
    {
      "src": "videos/forearm-dumbbell-01.mp4",
      "poster": "videos/forearm-dumbbell-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 17,
      "sizeBytes": 628563
    }
  ],
  "shrugs": [
    {
      "src": "videos/shrugs-01.mp4",
      "poster": "videos/shrugs-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.8,
      "sizeBytes": 177819
    }
  ],
  "reverse-machine-fly": [
    {
      "src": "videos/reverse-machine-fly-01.mp4",
      "poster": "videos/reverse-machine-fly-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6,
      "sizeBytes": 296539
    },
    {
      "src": "videos/reverse-machine-fly-02.mp4",
      "poster": "videos/reverse-machine-fly-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.4,
      "sizeBytes": 281063
    }
  ],
  "leg-press": [
    {
      "src": "videos/leg-press-01.mp4",
      "poster": "videos/leg-press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 28.8,
      "sizeBytes": 1208128
    },
    {
      "src": "videos/machine-squat-01.mp4",
      "poster": "videos/machine-squat-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 18.9,
      "sizeBytes": 760469
    }
  ],
  "calf-raise": [
    {
      "src": "videos/calf-raise-01.mp4",
      "poster": "videos/calf-raise-01.jpg",
      "width": 404,
      "height": 720,
      "durationSec": 56.7,
      "sizeBytes": 1335800
    }
  ],
  "leg-curl": [
    {
      "src": "videos/leg-curl-01.mp4",
      "poster": "videos/leg-curl-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.6,
      "sizeBytes": 491643
    }
  ],
  "leg-extension": [
    {
      "src": "videos/leg-extension-01.mp4",
      "poster": "videos/leg-extension-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.6,
      "sizeBytes": 391240
    }
  ],
  "abs": [
    {
      "src": "videos/abs-01.mp4",
      "poster": "videos/abs-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.2,
      "sizeBytes": 304069
    }
  ]
}

/** סך כל המשקל של הסרטונים המצורפים, בבתים */
export const VIDEO_TOTAL_BYTES = 30396925

/** מספר הסרטונים המצורפים */
export const VIDEO_COUNT = 36

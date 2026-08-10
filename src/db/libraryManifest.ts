// קובץ נוצר אוטומטית על ידי scripts/import-videos.mjs — אין לערוך ידנית.
// הרצה מחדש: npm run import:videos

import type { MuscleGroup } from './types'
import type { BundledVideo } from './videoManifest'

/** מה הסרטון הספציפי הזה מלמד, וקישור למקור */
export interface LibraryVideoNote {
  topic: string
  url: string
}

export interface LibraryExercise {
  /** תמיד בתחילית lib- כדי שלא יתנגש במזהי תרגילי התוכנית */
  id: string
  nameHe: string
  nameEn: string
  muscleGroup: MuscleGroup
  /** מקביל אחד-לאחד ל-LIBRARY_MANIFEST[id] */
  videos: LibraryVideoNote[]
  /** כמה סרטונים קיימים במקור. שווה לאורך videos כשאין תקרה. */
  totalAvailable: number
}

/** הסרטונים עצמם. אותו מבנה כמו VIDEO_MANIFEST, כדי ש-mediaDb יטפל בשניהם. */
export const LIBRARY_MANIFEST: Record<string, BundledVideo[]> = {
  "lib-reverse_wrist_curl": [
    {
      "src": "videos/lib/reverse_wrist_curl-01.mp4",
      "poster": "videos/lib/reverse_wrist_curl-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 29.2,
      "sizeBytes": 1185213
    },
    {
      "src": "videos/lib/reverse_wrist_curl-02.mp4",
      "poster": "videos/lib/reverse_wrist_curl-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 16.8,
      "sizeBytes": 531747
    },
    {
      "src": "videos/lib/reverse_wrist_curl-03.mp4",
      "poster": "videos/lib/reverse_wrist_curl-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 24.7,
      "sizeBytes": 969053
    },
    {
      "src": "videos/lib/reverse_wrist_curl-04.mp4",
      "poster": "videos/lib/reverse_wrist_curl-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 37.6,
      "sizeBytes": 1019902
    }
  ],
  "lib-cable_crunch": [
    {
      "src": "videos/lib/cable_crunch-01.mp4",
      "poster": "videos/lib/cable_crunch-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.3,
      "sizeBytes": 263909
    },
    {
      "src": "videos/lib/cable_crunch-02.mp4",
      "poster": "videos/lib/cable_crunch-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.8,
      "sizeBytes": 295901
    },
    {
      "src": "videos/lib/cable_crunch-03.mp4",
      "poster": "videos/lib/cable_crunch-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.7,
      "sizeBytes": 304564
    },
    {
      "src": "videos/lib/cable_crunch-04.mp4",
      "poster": "videos/lib/cable_crunch-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.8,
      "sizeBytes": 319126
    },
    {
      "src": "videos/lib/cable_crunch-05.mp4",
      "poster": "videos/lib/cable_crunch-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.9,
      "sizeBytes": 344759
    }
  ],
  "lib-crunch": [
    {
      "src": "videos/lib/crunch-01.mp4",
      "poster": "videos/lib/crunch-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.5,
      "sizeBytes": 359165
    },
    {
      "src": "videos/lib/crunch-02.mp4",
      "poster": "videos/lib/crunch-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.3,
      "sizeBytes": 269665
    },
    {
      "src": "videos/lib/crunch-03.mp4",
      "poster": "videos/lib/crunch-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.8,
      "sizeBytes": 565332
    }
  ],
  "lib-plank": [
    {
      "src": "videos/lib/plank-01.mp4",
      "poster": "videos/lib/plank-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.2,
      "sizeBytes": 68560
    },
    {
      "src": "videos/lib/plank-02.mp4",
      "poster": "videos/lib/plank-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.1,
      "sizeBytes": 87946
    },
    {
      "src": "videos/lib/plank-03.mp4",
      "poster": "videos/lib/plank-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.6,
      "sizeBytes": 461159
    }
  ],
  "lib-leg_raise": [
    {
      "src": "videos/lib/leg_raise-01.mp4",
      "poster": "videos/lib/leg_raise-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.3,
      "sizeBytes": 194999
    }
  ],
  "lib-lat_pulldown": [
    {
      "src": "videos/lib/lat_pulldown-01.mp4",
      "poster": "videos/lib/lat_pulldown-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.4,
      "sizeBytes": 366430
    },
    {
      "src": "videos/lib/lat_pulldown-02.mp4",
      "poster": "videos/lib/lat_pulldown-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.5,
      "sizeBytes": 347412
    },
    {
      "src": "videos/lib/lat_pulldown-03.mp4",
      "poster": "videos/lib/lat_pulldown-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.8,
      "sizeBytes": 221389
    },
    {
      "src": "videos/lib/lat_pulldown-04.mp4",
      "poster": "videos/lib/lat_pulldown-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.1,
      "sizeBytes": 341956
    },
    {
      "src": "videos/lib/lat_pulldown-05.mp4",
      "poster": "videos/lib/lat_pulldown-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.5,
      "sizeBytes": 207307
    },
    {
      "src": "videos/lib/lat_pulldown-06.mp4",
      "poster": "videos/lib/lat_pulldown-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.7,
      "sizeBytes": 253191
    },
    {
      "src": "videos/lib/lat_pulldown-07.mp4",
      "poster": "videos/lib/lat_pulldown-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15,
      "sizeBytes": 562645
    },
    {
      "src": "videos/lib/lat_pulldown-08.mp4",
      "poster": "videos/lib/lat_pulldown-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 16.3,
      "sizeBytes": 526617
    },
    {
      "src": "videos/lib/lat_pulldown-09.mp4",
      "poster": "videos/lib/lat_pulldown-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 21,
      "sizeBytes": 797335
    },
    {
      "src": "videos/lib/lat_pulldown-10.mp4",
      "poster": "videos/lib/lat_pulldown-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.9,
      "sizeBytes": 534949
    },
    {
      "src": "videos/lib/lat_pulldown-11.mp4",
      "poster": "videos/lib/lat_pulldown-11.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.6,
      "sizeBytes": 295681
    },
    {
      "src": "videos/lib/lat_pulldown-12.mp4",
      "poster": "videos/lib/lat_pulldown-12.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.8,
      "sizeBytes": 257261
    },
    {
      "src": "videos/lib/lat_pulldown-13.mp4",
      "poster": "videos/lib/lat_pulldown-13.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.6,
      "sizeBytes": 473041
    },
    {
      "src": "videos/lib/lat_pulldown-14.mp4",
      "poster": "videos/lib/lat_pulldown-14.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 19.5,
      "sizeBytes": 643019
    },
    {
      "src": "videos/lib/lat_pulldown-15.mp4",
      "poster": "videos/lib/lat_pulldown-15.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 20.2,
      "sizeBytes": 656479
    },
    {
      "src": "videos/lib/lat_pulldown-16.mp4",
      "poster": "videos/lib/lat_pulldown-16.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.1,
      "sizeBytes": 228283
    },
    {
      "src": "videos/lib/lat_pulldown-17.mp4",
      "poster": "videos/lib/lat_pulldown-17.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.3,
      "sizeBytes": 561545
    },
    {
      "src": "videos/lib/lat_pulldown-18.mp4",
      "poster": "videos/lib/lat_pulldown-18.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.4,
      "sizeBytes": 379375
    },
    {
      "src": "videos/lib/lat_pulldown-19.mp4",
      "poster": "videos/lib/lat_pulldown-19.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.1,
      "sizeBytes": 345441
    },
    {
      "src": "videos/lib/lat_pulldown-20.mp4",
      "poster": "videos/lib/lat_pulldown-20.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.5,
      "sizeBytes": 468880
    },
    {
      "src": "videos/lib/lat_pulldown-21.mp4",
      "poster": "videos/lib/lat_pulldown-21.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.9,
      "sizeBytes": 581633
    },
    {
      "src": "videos/lib/lat_pulldown-22.mp4",
      "poster": "videos/lib/lat_pulldown-22.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.1,
      "sizeBytes": 214773
    },
    {
      "src": "videos/lib/lat_pulldown-23.mp4",
      "poster": "videos/lib/lat_pulldown-23.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 19.6,
      "sizeBytes": 609117
    },
    {
      "src": "videos/lib/lat_pulldown-24.mp4",
      "poster": "videos/lib/lat_pulldown-24.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.3,
      "sizeBytes": 487925
    },
    {
      "src": "videos/lib/lat_pulldown-25.mp4",
      "poster": "videos/lib/lat_pulldown-25.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.5,
      "sizeBytes": 260977
    }
  ],
  "lib-seated_cable_row": [
    {
      "src": "videos/lib/seated_cable_row-01.mp4",
      "poster": "videos/lib/seated_cable_row-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.4,
      "sizeBytes": 280593
    },
    {
      "src": "videos/lib/seated_cable_row-02.mp4",
      "poster": "videos/lib/seated_cable_row-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.7,
      "sizeBytes": 310816
    },
    {
      "src": "videos/lib/seated_cable_row-03.mp4",
      "poster": "videos/lib/seated_cable_row-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.8,
      "sizeBytes": 360822
    },
    {
      "src": "videos/lib/seated_cable_row-04.mp4",
      "poster": "videos/lib/seated_cable_row-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.8,
      "sizeBytes": 240566
    },
    {
      "src": "videos/lib/seated_cable_row-05.mp4",
      "poster": "videos/lib/seated_cable_row-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.1,
      "sizeBytes": 455698
    },
    {
      "src": "videos/lib/seated_cable_row-06.mp4",
      "poster": "videos/lib/seated_cable_row-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.2,
      "sizeBytes": 569597
    },
    {
      "src": "videos/lib/seated_cable_row-07.mp4",
      "poster": "videos/lib/seated_cable_row-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 19.5,
      "sizeBytes": 642123
    },
    {
      "src": "videos/lib/seated_cable_row-08.mp4",
      "poster": "videos/lib/seated_cable_row-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.9,
      "sizeBytes": 390382
    },
    {
      "src": "videos/lib/seated_cable_row-09.mp4",
      "poster": "videos/lib/seated_cable_row-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.6,
      "sizeBytes": 451465
    },
    {
      "src": "videos/lib/seated_cable_row-10.mp4",
      "poster": "videos/lib/seated_cable_row-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.3,
      "sizeBytes": 306361
    },
    {
      "src": "videos/lib/seated_cable_row-11.mp4",
      "poster": "videos/lib/seated_cable_row-11.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.4,
      "sizeBytes": 278648
    },
    {
      "src": "videos/lib/seated_cable_row-12.mp4",
      "poster": "videos/lib/seated_cable_row-12.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8,
      "sizeBytes": 330466
    },
    {
      "src": "videos/lib/seated_cable_row-13.mp4",
      "poster": "videos/lib/seated_cable_row-13.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 18.3,
      "sizeBytes": 573170
    },
    {
      "src": "videos/lib/seated_cable_row-14.mp4",
      "poster": "videos/lib/seated_cable_row-14.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.8,
      "sizeBytes": 259948
    },
    {
      "src": "videos/lib/seated_cable_row-15.mp4",
      "poster": "videos/lib/seated_cable_row-15.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.3,
      "sizeBytes": 355104
    },
    {
      "src": "videos/lib/seated_cable_row-16.mp4",
      "poster": "videos/lib/seated_cable_row-16.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.6,
      "sizeBytes": 345388
    },
    {
      "src": "videos/lib/seated_cable_row-17.mp4",
      "poster": "videos/lib/seated_cable_row-17.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 18.6,
      "sizeBytes": 540368
    },
    {
      "src": "videos/lib/seated_cable_row-18.mp4",
      "poster": "videos/lib/seated_cable_row-18.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.5,
      "sizeBytes": 308853
    },
    {
      "src": "videos/lib/seated_cable_row-19.mp4",
      "poster": "videos/lib/seated_cable_row-19.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 18,
      "sizeBytes": 570017
    },
    {
      "src": "videos/lib/seated_cable_row-20.mp4",
      "poster": "videos/lib/seated_cable_row-20.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8,
      "sizeBytes": 325749
    },
    {
      "src": "videos/lib/seated_cable_row-21.mp4",
      "poster": "videos/lib/seated_cable_row-21.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.2,
      "sizeBytes": 497312
    },
    {
      "src": "videos/lib/seated_cable_row-22.mp4",
      "poster": "videos/lib/seated_cable_row-22.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 17.1,
      "sizeBytes": 495650
    }
  ],
  "lib-dumbbell_row": [
    {
      "src": "videos/lib/dumbbell_row-01.mp4",
      "poster": "videos/lib/dumbbell_row-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.2,
      "sizeBytes": 388765
    },
    {
      "src": "videos/lib/dumbbell_row-02.mp4",
      "poster": "videos/lib/dumbbell_row-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.9,
      "sizeBytes": 201133
    },
    {
      "src": "videos/lib/dumbbell_row-03.mp4",
      "poster": "videos/lib/dumbbell_row-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.7,
      "sizeBytes": 292485
    },
    {
      "src": "videos/lib/dumbbell_row-04.mp4",
      "poster": "videos/lib/dumbbell_row-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15,
      "sizeBytes": 336875
    },
    {
      "src": "videos/lib/dumbbell_row-05.mp4",
      "poster": "videos/lib/dumbbell_row-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13,
      "sizeBytes": 467819
    },
    {
      "src": "videos/lib/dumbbell_row-06.mp4",
      "poster": "videos/lib/dumbbell_row-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.2,
      "sizeBytes": 219053
    },
    {
      "src": "videos/lib/dumbbell_row-07.mp4",
      "poster": "videos/lib/dumbbell_row-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.9,
      "sizeBytes": 285610
    },
    {
      "src": "videos/lib/dumbbell_row-08.mp4",
      "poster": "videos/lib/dumbbell_row-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.5,
      "sizeBytes": 224363
    },
    {
      "src": "videos/lib/dumbbell_row-09.mp4",
      "poster": "videos/lib/dumbbell_row-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.1,
      "sizeBytes": 177440
    },
    {
      "src": "videos/lib/dumbbell_row-10.mp4",
      "poster": "videos/lib/dumbbell_row-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.5,
      "sizeBytes": 301568
    },
    {
      "src": "videos/lib/dumbbell_row-11.mp4",
      "poster": "videos/lib/dumbbell_row-11.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.9,
      "sizeBytes": 367667
    },
    {
      "src": "videos/lib/dumbbell_row-12.mp4",
      "poster": "videos/lib/dumbbell_row-12.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.3,
      "sizeBytes": 307740
    },
    {
      "src": "videos/lib/dumbbell_row-13.mp4",
      "poster": "videos/lib/dumbbell_row-13.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.2,
      "sizeBytes": 280086
    }
  ],
  "lib-pull_up": [
    {
      "src": "videos/lib/pull_up-01.mp4",
      "poster": "videos/lib/pull_up-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.6,
      "sizeBytes": 371948
    },
    {
      "src": "videos/lib/pull_up-02.mp4",
      "poster": "videos/lib/pull_up-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.6,
      "sizeBytes": 290956
    },
    {
      "src": "videos/lib/pull_up-03.mp4",
      "poster": "videos/lib/pull_up-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.6,
      "sizeBytes": 510157
    },
    {
      "src": "videos/lib/pull_up-04.mp4",
      "poster": "videos/lib/pull_up-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.2,
      "sizeBytes": 348928
    },
    {
      "src": "videos/lib/pull_up-05.mp4",
      "poster": "videos/lib/pull_up-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.1,
      "sizeBytes": 727354
    },
    {
      "src": "videos/lib/pull_up-06.mp4",
      "poster": "videos/lib/pull_up-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.6,
      "sizeBytes": 388461
    },
    {
      "src": "videos/lib/pull_up-07.mp4",
      "poster": "videos/lib/pull_up-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 16.3,
      "sizeBytes": 511461
    },
    {
      "src": "videos/lib/pull_up-08.mp4",
      "poster": "videos/lib/pull_up-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6,
      "sizeBytes": 236185
    },
    {
      "src": "videos/lib/pull_up-09.mp4",
      "poster": "videos/lib/pull_up-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.5,
      "sizeBytes": 280140
    },
    {
      "src": "videos/lib/pull_up-10.mp4",
      "poster": "videos/lib/pull_up-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.7,
      "sizeBytes": 232065
    },
    {
      "src": "videos/lib/pull_up-11.mp4",
      "poster": "videos/lib/pull_up-11.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 26.6,
      "sizeBytes": 1133284
    },
    {
      "src": "videos/lib/pull_up-12.mp4",
      "poster": "videos/lib/pull_up-12.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.3,
      "sizeBytes": 462885
    },
    {
      "src": "videos/lib/pull_up-13.mp4",
      "poster": "videos/lib/pull_up-13.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.9,
      "sizeBytes": 430924
    }
  ],
  "lib-row_general": [
    {
      "src": "videos/lib/row_general-01.mp4",
      "poster": "videos/lib/row_general-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.6,
      "sizeBytes": 314906
    },
    {
      "src": "videos/lib/row_general-02.mp4",
      "poster": "videos/lib/row_general-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.7,
      "sizeBytes": 310867
    },
    {
      "src": "videos/lib/row_general-03.mp4",
      "poster": "videos/lib/row_general-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.6,
      "sizeBytes": 345263
    },
    {
      "src": "videos/lib/row_general-04.mp4",
      "poster": "videos/lib/row_general-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.6,
      "sizeBytes": 306694
    },
    {
      "src": "videos/lib/row_general-05.mp4",
      "poster": "videos/lib/row_general-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.4,
      "sizeBytes": 175457
    },
    {
      "src": "videos/lib/row_general-06.mp4",
      "poster": "videos/lib/row_general-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.4,
      "sizeBytes": 205046
    },
    {
      "src": "videos/lib/row_general-07.mp4",
      "poster": "videos/lib/row_general-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.7,
      "sizeBytes": 543597
    },
    {
      "src": "videos/lib/row_general-08.mp4",
      "poster": "videos/lib/row_general-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 21.1,
      "sizeBytes": 694220
    }
  ],
  "lib-barbell_row": [
    {
      "src": "videos/lib/barbell_row-01.mp4",
      "poster": "videos/lib/barbell_row-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.5,
      "sizeBytes": 254667
    },
    {
      "src": "videos/lib/barbell_row-02.mp4",
      "poster": "videos/lib/barbell_row-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.6,
      "sizeBytes": 356508
    },
    {
      "src": "videos/lib/barbell_row-03.mp4",
      "poster": "videos/lib/barbell_row-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.1,
      "sizeBytes": 214410
    },
    {
      "src": "videos/lib/barbell_row-04.mp4",
      "poster": "videos/lib/barbell_row-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.3,
      "sizeBytes": 260862
    },
    {
      "src": "videos/lib/barbell_row-05.mp4",
      "poster": "videos/lib/barbell_row-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.7,
      "sizeBytes": 374575
    },
    {
      "src": "videos/lib/barbell_row-06.mp4",
      "poster": "videos/lib/barbell_row-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.3,
      "sizeBytes": 400903
    },
    {
      "src": "videos/lib/barbell_row-07.mp4",
      "poster": "videos/lib/barbell_row-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 16.4,
      "sizeBytes": 579056
    },
    {
      "src": "videos/lib/barbell_row-08.mp4",
      "poster": "videos/lib/barbell_row-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.3,
      "sizeBytes": 316239
    }
  ],
  "lib-deadlift": [
    {
      "src": "videos/lib/deadlift-01.mp4",
      "poster": "videos/lib/deadlift-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.3,
      "sizeBytes": 395787
    },
    {
      "src": "videos/lib/deadlift-02.mp4",
      "poster": "videos/lib/deadlift-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 26.1,
      "sizeBytes": 924325
    },
    {
      "src": "videos/lib/deadlift-03.mp4",
      "poster": "videos/lib/deadlift-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.9,
      "sizeBytes": 345229
    },
    {
      "src": "videos/lib/deadlift-04.mp4",
      "poster": "videos/lib/deadlift-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 30.2,
      "sizeBytes": 1091168
    },
    {
      "src": "videos/lib/deadlift-05.mp4",
      "poster": "videos/lib/deadlift-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.6,
      "sizeBytes": 382550
    },
    {
      "src": "videos/lib/deadlift-06.mp4",
      "poster": "videos/lib/deadlift-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.5,
      "sizeBytes": 223785
    },
    {
      "src": "videos/lib/deadlift-07.mp4",
      "poster": "videos/lib/deadlift-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.4,
      "sizeBytes": 393443
    }
  ],
  "lib-romanian_deadlift": [
    {
      "src": "videos/lib/romanian_deadlift-01.mp4",
      "poster": "videos/lib/romanian_deadlift-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.7,
      "sizeBytes": 209358
    },
    {
      "src": "videos/lib/romanian_deadlift-02.mp4",
      "poster": "videos/lib/romanian_deadlift-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.4,
      "sizeBytes": 371541
    },
    {
      "src": "videos/lib/romanian_deadlift-03.mp4",
      "poster": "videos/lib/romanian_deadlift-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 16.3,
      "sizeBytes": 506971
    }
  ],
  "lib-back_extension": [
    {
      "src": "videos/lib/back_extension-01.mp4",
      "poster": "videos/lib/back_extension-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.8,
      "sizeBytes": 344343
    },
    {
      "src": "videos/lib/back_extension-02.mp4",
      "poster": "videos/lib/back_extension-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.8,
      "sizeBytes": 329953
    },
    {
      "src": "videos/lib/back_extension-03.mp4",
      "poster": "videos/lib/back_extension-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.2,
      "sizeBytes": 352441
    }
  ],
  "lib-t_bar_row": [
    {
      "src": "videos/lib/t_bar_row-01.mp4",
      "poster": "videos/lib/t_bar_row-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.8,
      "sizeBytes": 515141
    },
    {
      "src": "videos/lib/t_bar_row-02.mp4",
      "poster": "videos/lib/t_bar_row-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.4,
      "sizeBytes": 385410
    }
  ],
  "lib-landmine_row": [
    {
      "src": "videos/lib/landmine_row-01.mp4",
      "poster": "videos/lib/landmine_row-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.6,
      "sizeBytes": 549300
    },
    {
      "src": "videos/lib/landmine_row-02.mp4",
      "poster": "videos/lib/landmine_row-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 18.1,
      "sizeBytes": 596186
    }
  ],
  "lib-machine_row": [
    {
      "src": "videos/lib/machine_row-01.mp4",
      "poster": "videos/lib/machine_row-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8,
      "sizeBytes": 272636
    }
  ],
  "lib-straight_arm_pulldown": [
    {
      "src": "videos/lib/straight_arm_pulldown-01.mp4",
      "poster": "videos/lib/straight_arm_pulldown-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.8,
      "sizeBytes": 425926
    }
  ],
  "lib-barbell_bench_press": [
    {
      "src": "videos/lib/barbell_bench_press-01.mp4",
      "poster": "videos/lib/barbell_bench_press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9,
      "sizeBytes": 225389
    },
    {
      "src": "videos/lib/barbell_bench_press-02.mp4",
      "poster": "videos/lib/barbell_bench_press-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.4,
      "sizeBytes": 409078
    },
    {
      "src": "videos/lib/barbell_bench_press-03.mp4",
      "poster": "videos/lib/barbell_bench_press-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.2,
      "sizeBytes": 385399
    },
    {
      "src": "videos/lib/barbell_bench_press-04.mp4",
      "poster": "videos/lib/barbell_bench_press-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.3,
      "sizeBytes": 469322
    },
    {
      "src": "videos/lib/barbell_bench_press-05.mp4",
      "poster": "videos/lib/barbell_bench_press-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 27.3,
      "sizeBytes": 873974
    },
    {
      "src": "videos/lib/barbell_bench_press-06.mp4",
      "poster": "videos/lib/barbell_bench_press-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 20.6,
      "sizeBytes": 855688
    },
    {
      "src": "videos/lib/barbell_bench_press-07.mp4",
      "poster": "videos/lib/barbell_bench_press-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.2,
      "sizeBytes": 293426
    },
    {
      "src": "videos/lib/barbell_bench_press-08.mp4",
      "poster": "videos/lib/barbell_bench_press-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 16.2,
      "sizeBytes": 506308
    },
    {
      "src": "videos/lib/barbell_bench_press-09.mp4",
      "poster": "videos/lib/barbell_bench_press-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.7,
      "sizeBytes": 312125
    },
    {
      "src": "videos/lib/barbell_bench_press-10.mp4",
      "poster": "videos/lib/barbell_bench_press-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.7,
      "sizeBytes": 359313
    },
    {
      "src": "videos/lib/barbell_bench_press-11.mp4",
      "poster": "videos/lib/barbell_bench_press-11.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.3,
      "sizeBytes": 407972
    },
    {
      "src": "videos/lib/barbell_bench_press-12.mp4",
      "poster": "videos/lib/barbell_bench_press-12.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.5,
      "sizeBytes": 589807
    },
    {
      "src": "videos/lib/barbell_bench_press-13.mp4",
      "poster": "videos/lib/barbell_bench_press-13.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.3,
      "sizeBytes": 366868
    },
    {
      "src": "videos/lib/barbell_bench_press-14.mp4",
      "poster": "videos/lib/barbell_bench_press-14.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 16.2,
      "sizeBytes": 568277
    },
    {
      "src": "videos/lib/barbell_bench_press-15.mp4",
      "poster": "videos/lib/barbell_bench_press-15.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.5,
      "sizeBytes": 363275
    },
    {
      "src": "videos/lib/barbell_bench_press-16.mp4",
      "poster": "videos/lib/barbell_bench_press-16.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.3,
      "sizeBytes": 467365
    },
    {
      "src": "videos/lib/barbell_bench_press-17.mp4",
      "poster": "videos/lib/barbell_bench_press-17.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.7,
      "sizeBytes": 366546
    },
    {
      "src": "videos/lib/barbell_bench_press-18.mp4",
      "poster": "videos/lib/barbell_bench_press-18.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 16.2,
      "sizeBytes": 483839
    },
    {
      "src": "videos/lib/barbell_bench_press-19.mp4",
      "poster": "videos/lib/barbell_bench_press-19.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.9,
      "sizeBytes": 362393
    },
    {
      "src": "videos/lib/barbell_bench_press-20.mp4",
      "poster": "videos/lib/barbell_bench_press-20.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10,
      "sizeBytes": 390568
    },
    {
      "src": "videos/lib/barbell_bench_press-21.mp4",
      "poster": "videos/lib/barbell_bench_press-21.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.6,
      "sizeBytes": 312414
    },
    {
      "src": "videos/lib/barbell_bench_press-22.mp4",
      "poster": "videos/lib/barbell_bench_press-22.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 25.2,
      "sizeBytes": 777650
    },
    {
      "src": "videos/lib/barbell_bench_press-23.mp4",
      "poster": "videos/lib/barbell_bench_press-23.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.8,
      "sizeBytes": 357623
    },
    {
      "src": "videos/lib/barbell_bench_press-24.mp4",
      "poster": "videos/lib/barbell_bench_press-24.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.3,
      "sizeBytes": 296299
    },
    {
      "src": "videos/lib/barbell_bench_press-25.mp4",
      "poster": "videos/lib/barbell_bench_press-25.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.4,
      "sizeBytes": 392512
    },
    {
      "src": "videos/lib/barbell_bench_press-26.mp4",
      "poster": "videos/lib/barbell_bench_press-26.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13,
      "sizeBytes": 372206
    },
    {
      "src": "videos/lib/barbell_bench_press-27.mp4",
      "poster": "videos/lib/barbell_bench_press-27.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.3,
      "sizeBytes": 429790
    },
    {
      "src": "videos/lib/barbell_bench_press-28.mp4",
      "poster": "videos/lib/barbell_bench_press-28.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.9,
      "sizeBytes": 431332
    },
    {
      "src": "videos/lib/barbell_bench_press-29.mp4",
      "poster": "videos/lib/barbell_bench_press-29.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 16.1,
      "sizeBytes": 480271
    },
    {
      "src": "videos/lib/barbell_bench_press-30.mp4",
      "poster": "videos/lib/barbell_bench_press-30.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 20.2,
      "sizeBytes": 592149
    },
    {
      "src": "videos/lib/barbell_bench_press-31.mp4",
      "poster": "videos/lib/barbell_bench_press-31.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.6,
      "sizeBytes": 304602
    },
    {
      "src": "videos/lib/barbell_bench_press-32.mp4",
      "poster": "videos/lib/barbell_bench_press-32.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.8,
      "sizeBytes": 239339
    },
    {
      "src": "videos/lib/barbell_bench_press-33.mp4",
      "poster": "videos/lib/barbell_bench_press-33.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 17.1,
      "sizeBytes": 387536
    },
    {
      "src": "videos/lib/barbell_bench_press-34.mp4",
      "poster": "videos/lib/barbell_bench_press-34.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.5,
      "sizeBytes": 494757
    }
  ],
  "lib-push_up": [
    {
      "src": "videos/lib/push_up-01.mp4",
      "poster": "videos/lib/push_up-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.5,
      "sizeBytes": 166769
    },
    {
      "src": "videos/lib/push_up-02.mp4",
      "poster": "videos/lib/push_up-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.1,
      "sizeBytes": 360505
    },
    {
      "src": "videos/lib/push_up-03.mp4",
      "poster": "videos/lib/push_up-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11,
      "sizeBytes": 321114
    },
    {
      "src": "videos/lib/push_up-04.mp4",
      "poster": "videos/lib/push_up-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.9,
      "sizeBytes": 304664
    },
    {
      "src": "videos/lib/push_up-05.mp4",
      "poster": "videos/lib/push_up-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.4,
      "sizeBytes": 326446
    },
    {
      "src": "videos/lib/push_up-06.mp4",
      "poster": "videos/lib/push_up-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11,
      "sizeBytes": 229464
    },
    {
      "src": "videos/lib/push_up-07.mp4",
      "poster": "videos/lib/push_up-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.1,
      "sizeBytes": 388762
    },
    {
      "src": "videos/lib/push_up-08.mp4",
      "poster": "videos/lib/push_up-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.4,
      "sizeBytes": 253023
    },
    {
      "src": "videos/lib/push_up-09.mp4",
      "poster": "videos/lib/push_up-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.9,
      "sizeBytes": 234482
    },
    {
      "src": "videos/lib/push_up-10.mp4",
      "poster": "videos/lib/push_up-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.8,
      "sizeBytes": 366870
    },
    {
      "src": "videos/lib/push_up-11.mp4",
      "poster": "videos/lib/push_up-11.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 20.1,
      "sizeBytes": 842561
    },
    {
      "src": "videos/lib/push_up-12.mp4",
      "poster": "videos/lib/push_up-12.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.2,
      "sizeBytes": 297707
    },
    {
      "src": "videos/lib/push_up-13.mp4",
      "poster": "videos/lib/push_up-13.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 29.4,
      "sizeBytes": 857325
    },
    {
      "src": "videos/lib/push_up-14.mp4",
      "poster": "videos/lib/push_up-14.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.8,
      "sizeBytes": 179102
    },
    {
      "src": "videos/lib/push_up-15.mp4",
      "poster": "videos/lib/push_up-15.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.8,
      "sizeBytes": 261039
    },
    {
      "src": "videos/lib/push_up-16.mp4",
      "poster": "videos/lib/push_up-16.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.7,
      "sizeBytes": 258559
    },
    {
      "src": "videos/lib/push_up-17.mp4",
      "poster": "videos/lib/push_up-17.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.5,
      "sizeBytes": 280004
    },
    {
      "src": "videos/lib/push_up-18.mp4",
      "poster": "videos/lib/push_up-18.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.4,
      "sizeBytes": 259793
    },
    {
      "src": "videos/lib/push_up-19.mp4",
      "poster": "videos/lib/push_up-19.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.3,
      "sizeBytes": 596046
    },
    {
      "src": "videos/lib/push_up-20.mp4",
      "poster": "videos/lib/push_up-20.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.6,
      "sizeBytes": 305735
    },
    {
      "src": "videos/lib/push_up-21.mp4",
      "poster": "videos/lib/push_up-21.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.6,
      "sizeBytes": 302502
    },
    {
      "src": "videos/lib/push_up-22.mp4",
      "poster": "videos/lib/push_up-22.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.1,
      "sizeBytes": 213286
    },
    {
      "src": "videos/lib/push_up-23.mp4",
      "poster": "videos/lib/push_up-23.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.1,
      "sizeBytes": 243250
    },
    {
      "src": "videos/lib/push_up-24.mp4",
      "poster": "videos/lib/push_up-24.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.5,
      "sizeBytes": 251734
    },
    {
      "src": "videos/lib/push_up-25.mp4",
      "poster": "videos/lib/push_up-25.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.3,
      "sizeBytes": 292212
    },
    {
      "src": "videos/lib/push_up-26.mp4",
      "poster": "videos/lib/push_up-26.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.6,
      "sizeBytes": 357203
    },
    {
      "src": "videos/lib/push_up-27.mp4",
      "poster": "videos/lib/push_up-27.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 31.4,
      "sizeBytes": 1022173
    }
  ],
  "lib-cable_chest_fly": [
    {
      "src": "videos/lib/cable_chest_fly-01.mp4",
      "poster": "videos/lib/cable_chest_fly-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.9,
      "sizeBytes": 300456
    },
    {
      "src": "videos/lib/cable_chest_fly-02.mp4",
      "poster": "videos/lib/cable_chest_fly-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.9,
      "sizeBytes": 261705
    },
    {
      "src": "videos/lib/cable_chest_fly-03.mp4",
      "poster": "videos/lib/cable_chest_fly-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.7,
      "sizeBytes": 293187
    },
    {
      "src": "videos/lib/cable_chest_fly-04.mp4",
      "poster": "videos/lib/cable_chest_fly-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.5,
      "sizeBytes": 395001
    },
    {
      "src": "videos/lib/cable_chest_fly-05.mp4",
      "poster": "videos/lib/cable_chest_fly-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.2,
      "sizeBytes": 330856
    },
    {
      "src": "videos/lib/cable_chest_fly-06.mp4",
      "poster": "videos/lib/cable_chest_fly-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.3,
      "sizeBytes": 393766
    },
    {
      "src": "videos/lib/cable_chest_fly-07.mp4",
      "poster": "videos/lib/cable_chest_fly-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.9,
      "sizeBytes": 380958
    },
    {
      "src": "videos/lib/cable_chest_fly-08.mp4",
      "poster": "videos/lib/cable_chest_fly-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.7,
      "sizeBytes": 461446
    },
    {
      "src": "videos/lib/cable_chest_fly-09.mp4",
      "poster": "videos/lib/cable_chest_fly-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 17.6,
      "sizeBytes": 691366
    },
    {
      "src": "videos/lib/cable_chest_fly-10.mp4",
      "poster": "videos/lib/cable_chest_fly-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.9,
      "sizeBytes": 295112
    },
    {
      "src": "videos/lib/cable_chest_fly-11.mp4",
      "poster": "videos/lib/cable_chest_fly-11.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.1,
      "sizeBytes": 379435
    },
    {
      "src": "videos/lib/cable_chest_fly-12.mp4",
      "poster": "videos/lib/cable_chest_fly-12.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.4,
      "sizeBytes": 387220
    },
    {
      "src": "videos/lib/cable_chest_fly-13.mp4",
      "poster": "videos/lib/cable_chest_fly-13.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15,
      "sizeBytes": 357831
    },
    {
      "src": "videos/lib/cable_chest_fly-14.mp4",
      "poster": "videos/lib/cable_chest_fly-14.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 20.1,
      "sizeBytes": 786635
    },
    {
      "src": "videos/lib/cable_chest_fly-15.mp4",
      "poster": "videos/lib/cable_chest_fly-15.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.5,
      "sizeBytes": 431969
    },
    {
      "src": "videos/lib/cable_chest_fly-16.mp4",
      "poster": "videos/lib/cable_chest_fly-16.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 19.5,
      "sizeBytes": 559243
    },
    {
      "src": "videos/lib/cable_chest_fly-17.mp4",
      "poster": "videos/lib/cable_chest_fly-17.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.7,
      "sizeBytes": 345204
    },
    {
      "src": "videos/lib/cable_chest_fly-18.mp4",
      "poster": "videos/lib/cable_chest_fly-18.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.8,
      "sizeBytes": 443485
    },
    {
      "src": "videos/lib/cable_chest_fly-19.mp4",
      "poster": "videos/lib/cable_chest_fly-19.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.6,
      "sizeBytes": 442974
    },
    {
      "src": "videos/lib/cable_chest_fly-20.mp4",
      "poster": "videos/lib/cable_chest_fly-20.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.2,
      "sizeBytes": 305668
    },
    {
      "src": "videos/lib/cable_chest_fly-21.mp4",
      "poster": "videos/lib/cable_chest_fly-21.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.4,
      "sizeBytes": 392179
    }
  ],
  "lib-dumbbell_bench_press": [
    {
      "src": "videos/lib/dumbbell_bench_press-01.mp4",
      "poster": "videos/lib/dumbbell_bench_press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.9,
      "sizeBytes": 264388
    },
    {
      "src": "videos/lib/dumbbell_bench_press-02.mp4",
      "poster": "videos/lib/dumbbell_bench_press-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.4,
      "sizeBytes": 299176
    },
    {
      "src": "videos/lib/dumbbell_bench_press-03.mp4",
      "poster": "videos/lib/dumbbell_bench_press-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.8,
      "sizeBytes": 220286
    },
    {
      "src": "videos/lib/dumbbell_bench_press-04.mp4",
      "poster": "videos/lib/dumbbell_bench_press-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.5,
      "sizeBytes": 318001
    },
    {
      "src": "videos/lib/dumbbell_bench_press-05.mp4",
      "poster": "videos/lib/dumbbell_bench_press-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15,
      "sizeBytes": 384875
    },
    {
      "src": "videos/lib/dumbbell_bench_press-06.mp4",
      "poster": "videos/lib/dumbbell_bench_press-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.3,
      "sizeBytes": 240448
    },
    {
      "src": "videos/lib/dumbbell_bench_press-07.mp4",
      "poster": "videos/lib/dumbbell_bench_press-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.8,
      "sizeBytes": 380706
    },
    {
      "src": "videos/lib/dumbbell_bench_press-08.mp4",
      "poster": "videos/lib/dumbbell_bench_press-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.2,
      "sizeBytes": 169347
    },
    {
      "src": "videos/lib/dumbbell_bench_press-09.mp4",
      "poster": "videos/lib/dumbbell_bench_press-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.5,
      "sizeBytes": 208564
    },
    {
      "src": "videos/lib/dumbbell_bench_press-10.mp4",
      "poster": "videos/lib/dumbbell_bench_press-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.6,
      "sizeBytes": 254582
    },
    {
      "src": "videos/lib/dumbbell_bench_press-11.mp4",
      "poster": "videos/lib/dumbbell_bench_press-11.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11,
      "sizeBytes": 351291
    },
    {
      "src": "videos/lib/dumbbell_bench_press-12.mp4",
      "poster": "videos/lib/dumbbell_bench_press-12.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.5,
      "sizeBytes": 205097
    }
  ],
  "lib-incline_barbell_bench_press": [
    {
      "src": "videos/lib/incline_barbell_bench_press-01.mp4",
      "poster": "videos/lib/incline_barbell_bench_press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.6,
      "sizeBytes": 222470
    },
    {
      "src": "videos/lib/incline_barbell_bench_press-02.mp4",
      "poster": "videos/lib/incline_barbell_bench_press-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.1,
      "sizeBytes": 376540
    },
    {
      "src": "videos/lib/incline_barbell_bench_press-03.mp4",
      "poster": "videos/lib/incline_barbell_bench_press-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 18.2,
      "sizeBytes": 671970
    },
    {
      "src": "videos/lib/incline_barbell_bench_press-04.mp4",
      "poster": "videos/lib/incline_barbell_bench_press-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.2,
      "sizeBytes": 361914
    },
    {
      "src": "videos/lib/incline_barbell_bench_press-05.mp4",
      "poster": "videos/lib/incline_barbell_bench_press-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 21.6,
      "sizeBytes": 676187
    }
  ],
  "lib-machine_chest_press": [
    {
      "src": "videos/lib/machine_chest_press-01.mp4",
      "poster": "videos/lib/machine_chest_press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.3,
      "sizeBytes": 189516
    },
    {
      "src": "videos/lib/machine_chest_press-02.mp4",
      "poster": "videos/lib/machine_chest_press-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.1,
      "sizeBytes": 293337
    },
    {
      "src": "videos/lib/machine_chest_press-03.mp4",
      "poster": "videos/lib/machine_chest_press-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.4,
      "sizeBytes": 301068
    },
    {
      "src": "videos/lib/machine_chest_press-04.mp4",
      "poster": "videos/lib/machine_chest_press-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 19.5,
      "sizeBytes": 657221
    },
    {
      "src": "videos/lib/machine_chest_press-05.mp4",
      "poster": "videos/lib/machine_chest_press-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.9,
      "sizeBytes": 219263
    }
  ],
  "lib-dumbbell_chest_fly": [
    {
      "src": "videos/lib/dumbbell_chest_fly-01.mp4",
      "poster": "videos/lib/dumbbell_chest_fly-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.5,
      "sizeBytes": 259473
    },
    {
      "src": "videos/lib/dumbbell_chest_fly-02.mp4",
      "poster": "videos/lib/dumbbell_chest_fly-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.8,
      "sizeBytes": 216396
    },
    {
      "src": "videos/lib/dumbbell_chest_fly-03.mp4",
      "poster": "videos/lib/dumbbell_chest_fly-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.5,
      "sizeBytes": 329338
    },
    {
      "src": "videos/lib/dumbbell_chest_fly-04.mp4",
      "poster": "videos/lib/dumbbell_chest_fly-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.2,
      "sizeBytes": 277985
    },
    {
      "src": "videos/lib/dumbbell_chest_fly-05.mp4",
      "poster": "videos/lib/dumbbell_chest_fly-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.3,
      "sizeBytes": 219102
    }
  ],
  "lib-pec_deck_machine_chest_fly": [
    {
      "src": "videos/lib/pec_deck_machine_chest_fly-01.mp4",
      "poster": "videos/lib/pec_deck_machine_chest_fly-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.1,
      "sizeBytes": 251582
    },
    {
      "src": "videos/lib/pec_deck_machine_chest_fly-02.mp4",
      "poster": "videos/lib/pec_deck_machine_chest_fly-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.3,
      "sizeBytes": 440753
    },
    {
      "src": "videos/lib/pec_deck_machine_chest_fly-03.mp4",
      "poster": "videos/lib/pec_deck_machine_chest_fly-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7,
      "sizeBytes": 252373
    },
    {
      "src": "videos/lib/pec_deck_machine_chest_fly-04.mp4",
      "poster": "videos/lib/pec_deck_machine_chest_fly-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.4,
      "sizeBytes": 396100
    }
  ],
  "lib-smith_machine_bench_press": [
    {
      "src": "videos/lib/smith_machine_bench_press-01.mp4",
      "poster": "videos/lib/smith_machine_bench_press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13,
      "sizeBytes": 362416
    },
    {
      "src": "videos/lib/smith_machine_bench_press-02.mp4",
      "poster": "videos/lib/smith_machine_bench_press-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.6,
      "sizeBytes": 310032
    }
  ],
  "lib-incline_dumbbell_press": [
    {
      "src": "videos/lib/incline_dumbbell_press-01.mp4",
      "poster": "videos/lib/incline_dumbbell_press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.2,
      "sizeBytes": 426995
    }
  ],
  "lib-cable_chest_press": [
    {
      "src": "videos/lib/cable_chest_press-01.mp4",
      "poster": "videos/lib/cable_chest_press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 19.7,
      "sizeBytes": 746802
    }
  ],
  "lib-pullover": [
    {
      "src": "videos/lib/pullover-01.mp4",
      "poster": "videos/lib/pullover-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.3,
      "sizeBytes": 301954
    }
  ],
  "lib-triceps_pushdown": [
    {
      "src": "videos/lib/triceps_pushdown-01.mp4",
      "poster": "videos/lib/triceps_pushdown-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.7,
      "sizeBytes": 443066
    },
    {
      "src": "videos/lib/triceps_pushdown-02.mp4",
      "poster": "videos/lib/triceps_pushdown-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.1,
      "sizeBytes": 269122
    },
    {
      "src": "videos/lib/triceps_pushdown-03.mp4",
      "poster": "videos/lib/triceps_pushdown-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.2,
      "sizeBytes": 159226
    },
    {
      "src": "videos/lib/triceps_pushdown-04.mp4",
      "poster": "videos/lib/triceps_pushdown-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.1,
      "sizeBytes": 291670
    },
    {
      "src": "videos/lib/triceps_pushdown-05.mp4",
      "poster": "videos/lib/triceps_pushdown-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 18,
      "sizeBytes": 506595
    },
    {
      "src": "videos/lib/triceps_pushdown-06.mp4",
      "poster": "videos/lib/triceps_pushdown-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.4,
      "sizeBytes": 280203
    },
    {
      "src": "videos/lib/triceps_pushdown-07.mp4",
      "poster": "videos/lib/triceps_pushdown-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.6,
      "sizeBytes": 312929
    },
    {
      "src": "videos/lib/triceps_pushdown-08.mp4",
      "poster": "videos/lib/triceps_pushdown-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 17.6,
      "sizeBytes": 658731
    },
    {
      "src": "videos/lib/triceps_pushdown-09.mp4",
      "poster": "videos/lib/triceps_pushdown-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.5,
      "sizeBytes": 249414
    },
    {
      "src": "videos/lib/triceps_pushdown-10.mp4",
      "poster": "videos/lib/triceps_pushdown-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.3,
      "sizeBytes": 357264
    },
    {
      "src": "videos/lib/triceps_pushdown-11.mp4",
      "poster": "videos/lib/triceps_pushdown-11.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.8,
      "sizeBytes": 325618
    },
    {
      "src": "videos/lib/triceps_pushdown-12.mp4",
      "poster": "videos/lib/triceps_pushdown-12.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.2,
      "sizeBytes": 181554
    },
    {
      "src": "videos/lib/triceps_pushdown-13.mp4",
      "poster": "videos/lib/triceps_pushdown-13.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.3,
      "sizeBytes": 220851
    },
    {
      "src": "videos/lib/triceps_pushdown-14.mp4",
      "poster": "videos/lib/triceps_pushdown-14.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.4,
      "sizeBytes": 356146
    },
    {
      "src": "videos/lib/triceps_pushdown-15.mp4",
      "poster": "videos/lib/triceps_pushdown-15.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 17.1,
      "sizeBytes": 479506
    },
    {
      "src": "videos/lib/triceps_pushdown-16.mp4",
      "poster": "videos/lib/triceps_pushdown-16.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.6,
      "sizeBytes": 302127
    },
    {
      "src": "videos/lib/triceps_pushdown-17.mp4",
      "poster": "videos/lib/triceps_pushdown-17.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.9,
      "sizeBytes": 344900
    }
  ],
  "lib-skull_crusher": [
    {
      "src": "videos/lib/skull_crusher-01.mp4",
      "poster": "videos/lib/skull_crusher-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.6,
      "sizeBytes": 220872
    },
    {
      "src": "videos/lib/skull_crusher-02.mp4",
      "poster": "videos/lib/skull_crusher-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10,
      "sizeBytes": 161177
    },
    {
      "src": "videos/lib/skull_crusher-03.mp4",
      "poster": "videos/lib/skull_crusher-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.6,
      "sizeBytes": 243372
    },
    {
      "src": "videos/lib/skull_crusher-04.mp4",
      "poster": "videos/lib/skull_crusher-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.7,
      "sizeBytes": 384414
    },
    {
      "src": "videos/lib/skull_crusher-05.mp4",
      "poster": "videos/lib/skull_crusher-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.9,
      "sizeBytes": 311262
    },
    {
      "src": "videos/lib/skull_crusher-06.mp4",
      "poster": "videos/lib/skull_crusher-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7,
      "sizeBytes": 223675
    },
    {
      "src": "videos/lib/skull_crusher-07.mp4",
      "poster": "videos/lib/skull_crusher-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9,
      "sizeBytes": 314721
    },
    {
      "src": "videos/lib/skull_crusher-08.mp4",
      "poster": "videos/lib/skull_crusher-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.7,
      "sizeBytes": 382979
    },
    {
      "src": "videos/lib/skull_crusher-09.mp4",
      "poster": "videos/lib/skull_crusher-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14,
      "sizeBytes": 363798
    },
    {
      "src": "videos/lib/skull_crusher-10.mp4",
      "poster": "videos/lib/skull_crusher-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.1,
      "sizeBytes": 225610
    }
  ],
  "lib-overhead_triceps_extension": [
    {
      "src": "videos/lib/overhead_triceps_extension-01.mp4",
      "poster": "videos/lib/overhead_triceps_extension-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.5,
      "sizeBytes": 212602
    },
    {
      "src": "videos/lib/overhead_triceps_extension-02.mp4",
      "poster": "videos/lib/overhead_triceps_extension-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.4,
      "sizeBytes": 226032
    },
    {
      "src": "videos/lib/overhead_triceps_extension-03.mp4",
      "poster": "videos/lib/overhead_triceps_extension-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.3,
      "sizeBytes": 459516
    },
    {
      "src": "videos/lib/overhead_triceps_extension-04.mp4",
      "poster": "videos/lib/overhead_triceps_extension-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 18.6,
      "sizeBytes": 634053
    },
    {
      "src": "videos/lib/overhead_triceps_extension-05.mp4",
      "poster": "videos/lib/overhead_triceps_extension-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.7,
      "sizeBytes": 326894
    },
    {
      "src": "videos/lib/overhead_triceps_extension-06.mp4",
      "poster": "videos/lib/overhead_triceps_extension-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.9,
      "sizeBytes": 422593
    },
    {
      "src": "videos/lib/overhead_triceps_extension-07.mp4",
      "poster": "videos/lib/overhead_triceps_extension-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.4,
      "sizeBytes": 221984
    }
  ],
  "lib-triceps_kickback": [
    {
      "src": "videos/lib/triceps_kickback-01.mp4",
      "poster": "videos/lib/triceps_kickback-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.1,
      "sizeBytes": 256887
    },
    {
      "src": "videos/lib/triceps_kickback-02.mp4",
      "poster": "videos/lib/triceps_kickback-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.6,
      "sizeBytes": 393227
    },
    {
      "src": "videos/lib/triceps_kickback-03.mp4",
      "poster": "videos/lib/triceps_kickback-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.7,
      "sizeBytes": 238872
    },
    {
      "src": "videos/lib/triceps_kickback-04.mp4",
      "poster": "videos/lib/triceps_kickback-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.1,
      "sizeBytes": 252295
    },
    {
      "src": "videos/lib/triceps_kickback-05.mp4",
      "poster": "videos/lib/triceps_kickback-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.5,
      "sizeBytes": 514509
    }
  ],
  "lib-dips": [
    {
      "src": "videos/lib/dips-01.mp4",
      "poster": "videos/lib/dips-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.9,
      "sizeBytes": 242555
    },
    {
      "src": "videos/lib/dips-02.mp4",
      "poster": "videos/lib/dips-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.9,
      "sizeBytes": 250040
    },
    {
      "src": "videos/lib/dips-03.mp4",
      "poster": "videos/lib/dips-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.8,
      "sizeBytes": 290181
    },
    {
      "src": "videos/lib/dips-04.mp4",
      "poster": "videos/lib/dips-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.9,
      "sizeBytes": 220190
    },
    {
      "src": "videos/lib/dips-05.mp4",
      "poster": "videos/lib/dips-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.7,
      "sizeBytes": 226893
    }
  ],
  "lib-bench_dip": [
    {
      "src": "videos/lib/bench_dip-01.mp4",
      "poster": "videos/lib/bench_dip-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.3,
      "sizeBytes": 372710
    },
    {
      "src": "videos/lib/bench_dip-02.mp4",
      "poster": "videos/lib/bench_dip-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.3,
      "sizeBytes": 296614
    },
    {
      "src": "videos/lib/bench_dip-03.mp4",
      "poster": "videos/lib/bench_dip-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.4,
      "sizeBytes": 325181
    },
    {
      "src": "videos/lib/bench_dip-04.mp4",
      "poster": "videos/lib/bench_dip-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.5,
      "sizeBytes": 294689
    }
  ],
  "lib-dumbbell_curl": [
    {
      "src": "videos/lib/dumbbell_curl-01.mp4",
      "poster": "videos/lib/dumbbell_curl-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.4,
      "sizeBytes": 221294
    },
    {
      "src": "videos/lib/dumbbell_curl-02.mp4",
      "poster": "videos/lib/dumbbell_curl-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.8,
      "sizeBytes": 275608
    },
    {
      "src": "videos/lib/dumbbell_curl-03.mp4",
      "poster": "videos/lib/dumbbell_curl-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 26.3,
      "sizeBytes": 809929
    },
    {
      "src": "videos/lib/dumbbell_curl-04.mp4",
      "poster": "videos/lib/dumbbell_curl-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.5,
      "sizeBytes": 245039
    },
    {
      "src": "videos/lib/dumbbell_curl-05.mp4",
      "poster": "videos/lib/dumbbell_curl-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.2,
      "sizeBytes": 377807
    },
    {
      "src": "videos/lib/dumbbell_curl-06.mp4",
      "poster": "videos/lib/dumbbell_curl-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.6,
      "sizeBytes": 232035
    },
    {
      "src": "videos/lib/dumbbell_curl-07.mp4",
      "poster": "videos/lib/dumbbell_curl-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.2,
      "sizeBytes": 374584
    },
    {
      "src": "videos/lib/dumbbell_curl-08.mp4",
      "poster": "videos/lib/dumbbell_curl-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.7,
      "sizeBytes": 272070
    },
    {
      "src": "videos/lib/dumbbell_curl-09.mp4",
      "poster": "videos/lib/dumbbell_curl-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 21.1,
      "sizeBytes": 428659
    },
    {
      "src": "videos/lib/dumbbell_curl-10.mp4",
      "poster": "videos/lib/dumbbell_curl-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.4,
      "sizeBytes": 506695
    },
    {
      "src": "videos/lib/dumbbell_curl-11.mp4",
      "poster": "videos/lib/dumbbell_curl-11.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.1,
      "sizeBytes": 610502
    },
    {
      "src": "videos/lib/dumbbell_curl-12.mp4",
      "poster": "videos/lib/dumbbell_curl-12.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.5,
      "sizeBytes": 245171
    },
    {
      "src": "videos/lib/dumbbell_curl-13.mp4",
      "poster": "videos/lib/dumbbell_curl-13.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 21.7,
      "sizeBytes": 1026641
    },
    {
      "src": "videos/lib/dumbbell_curl-14.mp4",
      "poster": "videos/lib/dumbbell_curl-14.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.9,
      "sizeBytes": 390792
    },
    {
      "src": "videos/lib/dumbbell_curl-15.mp4",
      "poster": "videos/lib/dumbbell_curl-15.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 36.3,
      "sizeBytes": 1054490
    },
    {
      "src": "videos/lib/dumbbell_curl-16.mp4",
      "poster": "videos/lib/dumbbell_curl-16.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.2,
      "sizeBytes": 232270
    },
    {
      "src": "videos/lib/dumbbell_curl-17.mp4",
      "poster": "videos/lib/dumbbell_curl-17.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.8,
      "sizeBytes": 287518
    },
    {
      "src": "videos/lib/dumbbell_curl-18.mp4",
      "poster": "videos/lib/dumbbell_curl-18.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.1,
      "sizeBytes": 210971
    },
    {
      "src": "videos/lib/dumbbell_curl-19.mp4",
      "poster": "videos/lib/dumbbell_curl-19.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.1,
      "sizeBytes": 307331
    },
    {
      "src": "videos/lib/dumbbell_curl-20.mp4",
      "poster": "videos/lib/dumbbell_curl-20.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.6,
      "sizeBytes": 432192
    },
    {
      "src": "videos/lib/dumbbell_curl-21.mp4",
      "poster": "videos/lib/dumbbell_curl-21.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.1,
      "sizeBytes": 289562
    },
    {
      "src": "videos/lib/dumbbell_curl-22.mp4",
      "poster": "videos/lib/dumbbell_curl-22.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.9,
      "sizeBytes": 249887
    },
    {
      "src": "videos/lib/dumbbell_curl-23.mp4",
      "poster": "videos/lib/dumbbell_curl-23.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13,
      "sizeBytes": 365869
    },
    {
      "src": "videos/lib/dumbbell_curl-24.mp4",
      "poster": "videos/lib/dumbbell_curl-24.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.4,
      "sizeBytes": 231385
    },
    {
      "src": "videos/lib/dumbbell_curl-25.mp4",
      "poster": "videos/lib/dumbbell_curl-25.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.7,
      "sizeBytes": 419823
    },
    {
      "src": "videos/lib/dumbbell_curl-26.mp4",
      "poster": "videos/lib/dumbbell_curl-26.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.7,
      "sizeBytes": 205383
    },
    {
      "src": "videos/lib/dumbbell_curl-27.mp4",
      "poster": "videos/lib/dumbbell_curl-27.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.9,
      "sizeBytes": 281353
    }
  ],
  "lib-preacher_curl": [
    {
      "src": "videos/lib/preacher_curl-01.mp4",
      "poster": "videos/lib/preacher_curl-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.8,
      "sizeBytes": 253858
    },
    {
      "src": "videos/lib/preacher_curl-02.mp4",
      "poster": "videos/lib/preacher_curl-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.4,
      "sizeBytes": 221661
    },
    {
      "src": "videos/lib/preacher_curl-03.mp4",
      "poster": "videos/lib/preacher_curl-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 21.5,
      "sizeBytes": 673853
    },
    {
      "src": "videos/lib/preacher_curl-04.mp4",
      "poster": "videos/lib/preacher_curl-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.1,
      "sizeBytes": 226771
    },
    {
      "src": "videos/lib/preacher_curl-05.mp4",
      "poster": "videos/lib/preacher_curl-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.3,
      "sizeBytes": 591744
    },
    {
      "src": "videos/lib/preacher_curl-06.mp4",
      "poster": "videos/lib/preacher_curl-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.2,
      "sizeBytes": 224173
    },
    {
      "src": "videos/lib/preacher_curl-07.mp4",
      "poster": "videos/lib/preacher_curl-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9,
      "sizeBytes": 294169
    }
  ],
  "lib-barbell_curl": [
    {
      "src": "videos/lib/barbell_curl-01.mp4",
      "poster": "videos/lib/barbell_curl-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.7,
      "sizeBytes": 481015
    }
  ],
  "lib-incline_dumbbell_curl": [
    {
      "src": "videos/lib/incline_dumbbell_curl-01.mp4",
      "poster": "videos/lib/incline_dumbbell_curl-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.4,
      "sizeBytes": 368122
    }
  ],
  "lib-rear_delt_fly": [
    {
      "src": "videos/lib/rear_delt_fly-01.mp4",
      "poster": "videos/lib/rear_delt_fly-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.8,
      "sizeBytes": 403831
    },
    {
      "src": "videos/lib/rear_delt_fly-02.mp4",
      "poster": "videos/lib/rear_delt_fly-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.6,
      "sizeBytes": 461482
    },
    {
      "src": "videos/lib/rear_delt_fly-03.mp4",
      "poster": "videos/lib/rear_delt_fly-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.4,
      "sizeBytes": 186939
    },
    {
      "src": "videos/lib/rear_delt_fly-04.mp4",
      "poster": "videos/lib/rear_delt_fly-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.8,
      "sizeBytes": 220377
    },
    {
      "src": "videos/lib/rear_delt_fly-05.mp4",
      "poster": "videos/lib/rear_delt_fly-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.1,
      "sizeBytes": 255819
    },
    {
      "src": "videos/lib/rear_delt_fly-06.mp4",
      "poster": "videos/lib/rear_delt_fly-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.3,
      "sizeBytes": 253009
    },
    {
      "src": "videos/lib/rear_delt_fly-07.mp4",
      "poster": "videos/lib/rear_delt_fly-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.6,
      "sizeBytes": 204716
    },
    {
      "src": "videos/lib/rear_delt_fly-08.mp4",
      "poster": "videos/lib/rear_delt_fly-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 17.3,
      "sizeBytes": 582257
    },
    {
      "src": "videos/lib/rear_delt_fly-09.mp4",
      "poster": "videos/lib/rear_delt_fly-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.7,
      "sizeBytes": 314412
    },
    {
      "src": "videos/lib/rear_delt_fly-10.mp4",
      "poster": "videos/lib/rear_delt_fly-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.1,
      "sizeBytes": 512056
    },
    {
      "src": "videos/lib/rear_delt_fly-11.mp4",
      "poster": "videos/lib/rear_delt_fly-11.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.8,
      "sizeBytes": 608888
    },
    {
      "src": "videos/lib/rear_delt_fly-12.mp4",
      "poster": "videos/lib/rear_delt_fly-12.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.7,
      "sizeBytes": 387471
    },
    {
      "src": "videos/lib/rear_delt_fly-13.mp4",
      "poster": "videos/lib/rear_delt_fly-13.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.2,
      "sizeBytes": 333483
    },
    {
      "src": "videos/lib/rear_delt_fly-14.mp4",
      "poster": "videos/lib/rear_delt_fly-14.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.1,
      "sizeBytes": 209840
    },
    {
      "src": "videos/lib/rear_delt_fly-15.mp4",
      "poster": "videos/lib/rear_delt_fly-15.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.6,
      "sizeBytes": 343341
    },
    {
      "src": "videos/lib/rear_delt_fly-16.mp4",
      "poster": "videos/lib/rear_delt_fly-16.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.3,
      "sizeBytes": 393899
    },
    {
      "src": "videos/lib/rear_delt_fly-17.mp4",
      "poster": "videos/lib/rear_delt_fly-17.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.5,
      "sizeBytes": 299190
    },
    {
      "src": "videos/lib/rear_delt_fly-18.mp4",
      "poster": "videos/lib/rear_delt_fly-18.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11,
      "sizeBytes": 387831
    },
    {
      "src": "videos/lib/rear_delt_fly-19.mp4",
      "poster": "videos/lib/rear_delt_fly-19.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.9,
      "sizeBytes": 418149
    },
    {
      "src": "videos/lib/rear_delt_fly-20.mp4",
      "poster": "videos/lib/rear_delt_fly-20.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.7,
      "sizeBytes": 453549
    },
    {
      "src": "videos/lib/rear_delt_fly-21.mp4",
      "poster": "videos/lib/rear_delt_fly-21.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.1,
      "sizeBytes": 343650
    },
    {
      "src": "videos/lib/rear_delt_fly-22.mp4",
      "poster": "videos/lib/rear_delt_fly-22.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.2,
      "sizeBytes": 454536
    },
    {
      "src": "videos/lib/rear_delt_fly-23.mp4",
      "poster": "videos/lib/rear_delt_fly-23.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.2,
      "sizeBytes": 402417
    },
    {
      "src": "videos/lib/rear_delt_fly-24.mp4",
      "poster": "videos/lib/rear_delt_fly-24.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.6,
      "sizeBytes": 289564
    },
    {
      "src": "videos/lib/rear_delt_fly-25.mp4",
      "poster": "videos/lib/rear_delt_fly-25.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.1,
      "sizeBytes": 214021
    },
    {
      "src": "videos/lib/rear_delt_fly-26.mp4",
      "poster": "videos/lib/rear_delt_fly-26.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.3,
      "sizeBytes": 348471
    },
    {
      "src": "videos/lib/rear_delt_fly-27.mp4",
      "poster": "videos/lib/rear_delt_fly-27.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.7,
      "sizeBytes": 307229
    },
    {
      "src": "videos/lib/rear_delt_fly-28.mp4",
      "poster": "videos/lib/rear_delt_fly-28.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.1,
      "sizeBytes": 282173
    }
  ],
  "lib-lateral_raise": [
    {
      "src": "videos/lib/lateral_raise-01.mp4",
      "poster": "videos/lib/lateral_raise-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.8,
      "sizeBytes": 259019
    },
    {
      "src": "videos/lib/lateral_raise-02.mp4",
      "poster": "videos/lib/lateral_raise-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.4,
      "sizeBytes": 301894
    },
    {
      "src": "videos/lib/lateral_raise-03.mp4",
      "poster": "videos/lib/lateral_raise-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.6,
      "sizeBytes": 214623
    },
    {
      "src": "videos/lib/lateral_raise-04.mp4",
      "poster": "videos/lib/lateral_raise-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.1,
      "sizeBytes": 452799
    },
    {
      "src": "videos/lib/lateral_raise-05.mp4",
      "poster": "videos/lib/lateral_raise-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.5,
      "sizeBytes": 334629
    },
    {
      "src": "videos/lib/lateral_raise-06.mp4",
      "poster": "videos/lib/lateral_raise-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.1,
      "sizeBytes": 175153
    },
    {
      "src": "videos/lib/lateral_raise-07.mp4",
      "poster": "videos/lib/lateral_raise-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.2,
      "sizeBytes": 219143
    },
    {
      "src": "videos/lib/lateral_raise-08.mp4",
      "poster": "videos/lib/lateral_raise-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.6,
      "sizeBytes": 309874
    },
    {
      "src": "videos/lib/lateral_raise-09.mp4",
      "poster": "videos/lib/lateral_raise-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.4,
      "sizeBytes": 310507
    },
    {
      "src": "videos/lib/lateral_raise-10.mp4",
      "poster": "videos/lib/lateral_raise-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 20.6,
      "sizeBytes": 722315
    },
    {
      "src": "videos/lib/lateral_raise-11.mp4",
      "poster": "videos/lib/lateral_raise-11.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.6,
      "sizeBytes": 239743
    },
    {
      "src": "videos/lib/lateral_raise-12.mp4",
      "poster": "videos/lib/lateral_raise-12.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.1,
      "sizeBytes": 251237
    },
    {
      "src": "videos/lib/lateral_raise-13.mp4",
      "poster": "videos/lib/lateral_raise-13.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.5,
      "sizeBytes": 268046
    },
    {
      "src": "videos/lib/lateral_raise-14.mp4",
      "poster": "videos/lib/lateral_raise-14.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.1,
      "sizeBytes": 625689
    },
    {
      "src": "videos/lib/lateral_raise-15.mp4",
      "poster": "videos/lib/lateral_raise-15.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.3,
      "sizeBytes": 270320
    },
    {
      "src": "videos/lib/lateral_raise-16.mp4",
      "poster": "videos/lib/lateral_raise-16.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.5,
      "sizeBytes": 248453
    },
    {
      "src": "videos/lib/lateral_raise-17.mp4",
      "poster": "videos/lib/lateral_raise-17.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.9,
      "sizeBytes": 220407
    },
    {
      "src": "videos/lib/lateral_raise-18.mp4",
      "poster": "videos/lib/lateral_raise-18.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.1,
      "sizeBytes": 246813
    },
    {
      "src": "videos/lib/lateral_raise-19.mp4",
      "poster": "videos/lib/lateral_raise-19.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.2,
      "sizeBytes": 449045
    }
  ],
  "lib-overhead_press": [
    {
      "src": "videos/lib/overhead_press-01.mp4",
      "poster": "videos/lib/overhead_press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.6,
      "sizeBytes": 308848
    },
    {
      "src": "videos/lib/overhead_press-02.mp4",
      "poster": "videos/lib/overhead_press-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.1,
      "sizeBytes": 264179
    },
    {
      "src": "videos/lib/overhead_press-03.mp4",
      "poster": "videos/lib/overhead_press-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.3,
      "sizeBytes": 364934
    },
    {
      "src": "videos/lib/overhead_press-04.mp4",
      "poster": "videos/lib/overhead_press-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.1,
      "sizeBytes": 407434
    },
    {
      "src": "videos/lib/overhead_press-05.mp4",
      "poster": "videos/lib/overhead_press-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9,
      "sizeBytes": 267395
    },
    {
      "src": "videos/lib/overhead_press-06.mp4",
      "poster": "videos/lib/overhead_press-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.5,
      "sizeBytes": 409985
    },
    {
      "src": "videos/lib/overhead_press-07.mp4",
      "poster": "videos/lib/overhead_press-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.3,
      "sizeBytes": 370216
    },
    {
      "src": "videos/lib/overhead_press-08.mp4",
      "poster": "videos/lib/overhead_press-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.9,
      "sizeBytes": 432113
    },
    {
      "src": "videos/lib/overhead_press-09.mp4",
      "poster": "videos/lib/overhead_press-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 17.1,
      "sizeBytes": 543570
    },
    {
      "src": "videos/lib/overhead_press-10.mp4",
      "poster": "videos/lib/overhead_press-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10,
      "sizeBytes": 301998
    },
    {
      "src": "videos/lib/overhead_press-11.mp4",
      "poster": "videos/lib/overhead_press-11.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.6,
      "sizeBytes": 284616
    },
    {
      "src": "videos/lib/overhead_press-12.mp4",
      "poster": "videos/lib/overhead_press-12.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7,
      "sizeBytes": 303822
    },
    {
      "src": "videos/lib/overhead_press-13.mp4",
      "poster": "videos/lib/overhead_press-13.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.3,
      "sizeBytes": 286670
    },
    {
      "src": "videos/lib/overhead_press-14.mp4",
      "poster": "videos/lib/overhead_press-14.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.6,
      "sizeBytes": 143333
    },
    {
      "src": "videos/lib/overhead_press-15.mp4",
      "poster": "videos/lib/overhead_press-15.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.5,
      "sizeBytes": 214682
    },
    {
      "src": "videos/lib/overhead_press-16.mp4",
      "poster": "videos/lib/overhead_press-16.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 22.7,
      "sizeBytes": 688149
    },
    {
      "src": "videos/lib/overhead_press-17.mp4",
      "poster": "videos/lib/overhead_press-17.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 23.8,
      "sizeBytes": 758937
    }
  ],
  "lib-shrug": [
    {
      "src": "videos/lib/shrug-01.mp4",
      "poster": "videos/lib/shrug-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.4,
      "sizeBytes": 252764
    },
    {
      "src": "videos/lib/shrug-02.mp4",
      "poster": "videos/lib/shrug-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9,
      "sizeBytes": 269161
    },
    {
      "src": "videos/lib/shrug-03.mp4",
      "poster": "videos/lib/shrug-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.8,
      "sizeBytes": 341828
    },
    {
      "src": "videos/lib/shrug-04.mp4",
      "poster": "videos/lib/shrug-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.5,
      "sizeBytes": 357070
    },
    {
      "src": "videos/lib/shrug-05.mp4",
      "poster": "videos/lib/shrug-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.6,
      "sizeBytes": 298851
    },
    {
      "src": "videos/lib/shrug-06.mp4",
      "poster": "videos/lib/shrug-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.3,
      "sizeBytes": 235890
    },
    {
      "src": "videos/lib/shrug-07.mp4",
      "poster": "videos/lib/shrug-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.3,
      "sizeBytes": 389241
    },
    {
      "src": "videos/lib/shrug-08.mp4",
      "poster": "videos/lib/shrug-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 18.6,
      "sizeBytes": 512277
    },
    {
      "src": "videos/lib/shrug-09.mp4",
      "poster": "videos/lib/shrug-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.7,
      "sizeBytes": 423952
    },
    {
      "src": "videos/lib/shrug-10.mp4",
      "poster": "videos/lib/shrug-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.5,
      "sizeBytes": 284327
    }
  ],
  "lib-cable_lateral_raise": [
    {
      "src": "videos/lib/cable_lateral_raise-01.mp4",
      "poster": "videos/lib/cable_lateral_raise-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.3,
      "sizeBytes": 236638
    },
    {
      "src": "videos/lib/cable_lateral_raise-02.mp4",
      "poster": "videos/lib/cable_lateral_raise-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 21.1,
      "sizeBytes": 656385
    },
    {
      "src": "videos/lib/cable_lateral_raise-03.mp4",
      "poster": "videos/lib/cable_lateral_raise-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 17.5,
      "sizeBytes": 565524
    },
    {
      "src": "videos/lib/cable_lateral_raise-04.mp4",
      "poster": "videos/lib/cable_lateral_raise-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.6,
      "sizeBytes": 432924
    }
  ],
  "lib-dumbbell_shoulder_press": [
    {
      "src": "videos/lib/dumbbell_shoulder_press-01.mp4",
      "poster": "videos/lib/dumbbell_shoulder_press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.8,
      "sizeBytes": 306909
    },
    {
      "src": "videos/lib/dumbbell_shoulder_press-02.mp4",
      "poster": "videos/lib/dumbbell_shoulder_press-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 19.8,
      "sizeBytes": 615716
    },
    {
      "src": "videos/lib/dumbbell_shoulder_press-03.mp4",
      "poster": "videos/lib/dumbbell_shoulder_press-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.7,
      "sizeBytes": 309323
    },
    {
      "src": "videos/lib/dumbbell_shoulder_press-04.mp4",
      "poster": "videos/lib/dumbbell_shoulder_press-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.4,
      "sizeBytes": 156993
    }
  ],
  "lib-machine_shoulder_press": [
    {
      "src": "videos/lib/machine_shoulder_press-01.mp4",
      "poster": "videos/lib/machine_shoulder_press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.7,
      "sizeBytes": 353252
    },
    {
      "src": "videos/lib/machine_shoulder_press-02.mp4",
      "poster": "videos/lib/machine_shoulder_press-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.7,
      "sizeBytes": 513887
    },
    {
      "src": "videos/lib/machine_shoulder_press-03.mp4",
      "poster": "videos/lib/machine_shoulder_press-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.6,
      "sizeBytes": 280338
    },
    {
      "src": "videos/lib/machine_shoulder_press-04.mp4",
      "poster": "videos/lib/machine_shoulder_press-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.6,
      "sizeBytes": 460353
    }
  ],
  "lib-upright_row": [
    {
      "src": "videos/lib/upright_row-01.mp4",
      "poster": "videos/lib/upright_row-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10,
      "sizeBytes": 244766
    },
    {
      "src": "videos/lib/upright_row-02.mp4",
      "poster": "videos/lib/upright_row-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11,
      "sizeBytes": 352620
    }
  ],
  "lib-face_pull": [
    {
      "src": "videos/lib/face_pull-01.mp4",
      "poster": "videos/lib/face_pull-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.7,
      "sizeBytes": 273075
    },
    {
      "src": "videos/lib/face_pull-02.mp4",
      "poster": "videos/lib/face_pull-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.8,
      "sizeBytes": 314277
    }
  ],
  "lib-front_raise": [
    {
      "src": "videos/lib/front_raise-01.mp4",
      "poster": "videos/lib/front_raise-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.6,
      "sizeBytes": 215186
    }
  ],
  "lib-arnold_press": [
    {
      "src": "videos/lib/arnold_press-01.mp4",
      "poster": "videos/lib/arnold_press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 16.2,
      "sizeBytes": 706948
    }
  ],
  "lib-barbell_squat": [
    {
      "src": "videos/lib/barbell_squat-01.mp4",
      "poster": "videos/lib/barbell_squat-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.4,
      "sizeBytes": 579743
    },
    {
      "src": "videos/lib/barbell_squat-02.mp4",
      "poster": "videos/lib/barbell_squat-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.9,
      "sizeBytes": 287110
    },
    {
      "src": "videos/lib/barbell_squat-03.mp4",
      "poster": "videos/lib/barbell_squat-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.2,
      "sizeBytes": 576094
    },
    {
      "src": "videos/lib/barbell_squat-04.mp4",
      "poster": "videos/lib/barbell_squat-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.7,
      "sizeBytes": 220054
    },
    {
      "src": "videos/lib/barbell_squat-05.mp4",
      "poster": "videos/lib/barbell_squat-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.1,
      "sizeBytes": 341277
    },
    {
      "src": "videos/lib/barbell_squat-06.mp4",
      "poster": "videos/lib/barbell_squat-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 18.5,
      "sizeBytes": 486692
    },
    {
      "src": "videos/lib/barbell_squat-07.mp4",
      "poster": "videos/lib/barbell_squat-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 22.9,
      "sizeBytes": 696649
    },
    {
      "src": "videos/lib/barbell_squat-08.mp4",
      "poster": "videos/lib/barbell_squat-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.8,
      "sizeBytes": 360587
    },
    {
      "src": "videos/lib/barbell_squat-09.mp4",
      "poster": "videos/lib/barbell_squat-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 34.2,
      "sizeBytes": 915798
    },
    {
      "src": "videos/lib/barbell_squat-10.mp4",
      "poster": "videos/lib/barbell_squat-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 31,
      "sizeBytes": 1379125
    },
    {
      "src": "videos/lib/barbell_squat-11.mp4",
      "poster": "videos/lib/barbell_squat-11.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.7,
      "sizeBytes": 285377
    },
    {
      "src": "videos/lib/barbell_squat-12.mp4",
      "poster": "videos/lib/barbell_squat-12.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 21.6,
      "sizeBytes": 1037627
    },
    {
      "src": "videos/lib/barbell_squat-13.mp4",
      "poster": "videos/lib/barbell_squat-13.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 24.7,
      "sizeBytes": 743985
    },
    {
      "src": "videos/lib/barbell_squat-14.mp4",
      "poster": "videos/lib/barbell_squat-14.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 32.1,
      "sizeBytes": 1180696
    },
    {
      "src": "videos/lib/barbell_squat-15.mp4",
      "poster": "videos/lib/barbell_squat-15.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.2,
      "sizeBytes": 362600
    },
    {
      "src": "videos/lib/barbell_squat-16.mp4",
      "poster": "videos/lib/barbell_squat-16.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.4,
      "sizeBytes": 249615
    },
    {
      "src": "videos/lib/barbell_squat-17.mp4",
      "poster": "videos/lib/barbell_squat-17.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.7,
      "sizeBytes": 407580
    },
    {
      "src": "videos/lib/barbell_squat-18.mp4",
      "poster": "videos/lib/barbell_squat-18.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.4,
      "sizeBytes": 355974
    },
    {
      "src": "videos/lib/barbell_squat-19.mp4",
      "poster": "videos/lib/barbell_squat-19.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.1,
      "sizeBytes": 341600
    },
    {
      "src": "videos/lib/barbell_squat-20.mp4",
      "poster": "videos/lib/barbell_squat-20.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.9,
      "sizeBytes": 293328
    },
    {
      "src": "videos/lib/barbell_squat-21.mp4",
      "poster": "videos/lib/barbell_squat-21.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8,
      "sizeBytes": 278362
    },
    {
      "src": "videos/lib/barbell_squat-22.mp4",
      "poster": "videos/lib/barbell_squat-22.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.4,
      "sizeBytes": 495641
    },
    {
      "src": "videos/lib/barbell_squat-23.mp4",
      "poster": "videos/lib/barbell_squat-23.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.4,
      "sizeBytes": 438873
    },
    {
      "src": "videos/lib/barbell_squat-24.mp4",
      "poster": "videos/lib/barbell_squat-24.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 30.8,
      "sizeBytes": 1046764
    }
  ],
  "lib-leg_press": [
    {
      "src": "videos/lib/leg_press-01.mp4",
      "poster": "videos/lib/leg_press-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.5,
      "sizeBytes": 457320
    },
    {
      "src": "videos/lib/leg_press-02.mp4",
      "poster": "videos/lib/leg_press-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.4,
      "sizeBytes": 374138
    },
    {
      "src": "videos/lib/leg_press-03.mp4",
      "poster": "videos/lib/leg_press-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.1,
      "sizeBytes": 337807
    },
    {
      "src": "videos/lib/leg_press-04.mp4",
      "poster": "videos/lib/leg_press-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 26,
      "sizeBytes": 1122008
    },
    {
      "src": "videos/lib/leg_press-05.mp4",
      "poster": "videos/lib/leg_press-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.7,
      "sizeBytes": 602556
    },
    {
      "src": "videos/lib/leg_press-06.mp4",
      "poster": "videos/lib/leg_press-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.3,
      "sizeBytes": 420675
    },
    {
      "src": "videos/lib/leg_press-07.mp4",
      "poster": "videos/lib/leg_press-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.7,
      "sizeBytes": 428670
    },
    {
      "src": "videos/lib/leg_press-08.mp4",
      "poster": "videos/lib/leg_press-08.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.4,
      "sizeBytes": 579776
    },
    {
      "src": "videos/lib/leg_press-09.mp4",
      "poster": "videos/lib/leg_press-09.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.3,
      "sizeBytes": 427777
    },
    {
      "src": "videos/lib/leg_press-10.mp4",
      "poster": "videos/lib/leg_press-10.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10.1,
      "sizeBytes": 523470
    },
    {
      "src": "videos/lib/leg_press-11.mp4",
      "poster": "videos/lib/leg_press-11.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.2,
      "sizeBytes": 465917
    }
  ],
  "lib-leg_curl": [
    {
      "src": "videos/lib/leg_curl-01.mp4",
      "poster": "videos/lib/leg_curl-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 18,
      "sizeBytes": 679177
    },
    {
      "src": "videos/lib/leg_curl-02.mp4",
      "poster": "videos/lib/leg_curl-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 20,
      "sizeBytes": 591307
    },
    {
      "src": "videos/lib/leg_curl-03.mp4",
      "poster": "videos/lib/leg_curl-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 16.9,
      "sizeBytes": 658667
    },
    {
      "src": "videos/lib/leg_curl-04.mp4",
      "poster": "videos/lib/leg_curl-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.2,
      "sizeBytes": 478530
    },
    {
      "src": "videos/lib/leg_curl-05.mp4",
      "poster": "videos/lib/leg_curl-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.6,
      "sizeBytes": 441591
    },
    {
      "src": "videos/lib/leg_curl-06.mp4",
      "poster": "videos/lib/leg_curl-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.4,
      "sizeBytes": 512198
    },
    {
      "src": "videos/lib/leg_curl-07.mp4",
      "poster": "videos/lib/leg_curl-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 18,
      "sizeBytes": 477516
    }
  ],
  "lib-leg_extension": [
    {
      "src": "videos/lib/leg_extension-01.mp4",
      "poster": "videos/lib/leg_extension-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8,
      "sizeBytes": 321847
    },
    {
      "src": "videos/lib/leg_extension-02.mp4",
      "poster": "videos/lib/leg_extension-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.6,
      "sizeBytes": 303683
    },
    {
      "src": "videos/lib/leg_extension-03.mp4",
      "poster": "videos/lib/leg_extension-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9,
      "sizeBytes": 356799
    },
    {
      "src": "videos/lib/leg_extension-04.mp4",
      "poster": "videos/lib/leg_extension-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.6,
      "sizeBytes": 319767
    },
    {
      "src": "videos/lib/leg_extension-05.mp4",
      "poster": "videos/lib/leg_extension-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 12.1,
      "sizeBytes": 554741
    },
    {
      "src": "videos/lib/leg_extension-06.mp4",
      "poster": "videos/lib/leg_extension-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 13.6,
      "sizeBytes": 680693
    },
    {
      "src": "videos/lib/leg_extension-07.mp4",
      "poster": "videos/lib/leg_extension-07.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 10,
      "sizeBytes": 390908
    }
  ],
  "lib-lunge": [
    {
      "src": "videos/lib/lunge-01.mp4",
      "poster": "videos/lib/lunge-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9,
      "sizeBytes": 335037
    },
    {
      "src": "videos/lib/lunge-02.mp4",
      "poster": "videos/lib/lunge-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7.3,
      "sizeBytes": 164771
    },
    {
      "src": "videos/lib/lunge-03.mp4",
      "poster": "videos/lib/lunge-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.3,
      "sizeBytes": 784640
    },
    {
      "src": "videos/lib/lunge-04.mp4",
      "poster": "videos/lib/lunge-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.5,
      "sizeBytes": 369482
    },
    {
      "src": "videos/lib/lunge-05.mp4",
      "poster": "videos/lib/lunge-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.2,
      "sizeBytes": 177323
    },
    {
      "src": "videos/lib/lunge-06.mp4",
      "poster": "videos/lib/lunge-06.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.2,
      "sizeBytes": 387509
    }
  ],
  "lib-smith_machine_squat": [
    {
      "src": "videos/lib/smith_machine_squat-01.mp4",
      "poster": "videos/lib/smith_machine_squat-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 20.5,
      "sizeBytes": 867621
    },
    {
      "src": "videos/lib/smith_machine_squat-02.mp4",
      "poster": "videos/lib/smith_machine_squat-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 9.7,
      "sizeBytes": 329513
    },
    {
      "src": "videos/lib/smith_machine_squat-03.mp4",
      "poster": "videos/lib/smith_machine_squat-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 7,
      "sizeBytes": 325705
    },
    {
      "src": "videos/lib/smith_machine_squat-04.mp4",
      "poster": "videos/lib/smith_machine_squat-04.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 20.7,
      "sizeBytes": 886688
    },
    {
      "src": "videos/lib/smith_machine_squat-05.mp4",
      "poster": "videos/lib/smith_machine_squat-05.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.7,
      "sizeBytes": 313992
    }
  ],
  "lib-hip_thrust": [
    {
      "src": "videos/lib/hip_thrust-01.mp4",
      "poster": "videos/lib/hip_thrust-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.3,
      "sizeBytes": 278654
    },
    {
      "src": "videos/lib/hip_thrust-02.mp4",
      "poster": "videos/lib/hip_thrust-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 6.4,
      "sizeBytes": 266444
    },
    {
      "src": "videos/lib/hip_thrust-03.mp4",
      "poster": "videos/lib/hip_thrust-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 11.9,
      "sizeBytes": 368578
    }
  ],
  "lib-bulgarian_split_squat": [
    {
      "src": "videos/lib/bulgarian_split_squat-01.mp4",
      "poster": "videos/lib/bulgarian_split_squat-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.4,
      "sizeBytes": 668787
    },
    {
      "src": "videos/lib/bulgarian_split_squat-02.mp4",
      "poster": "videos/lib/bulgarian_split_squat-02.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 15.1,
      "sizeBytes": 489691
    },
    {
      "src": "videos/lib/bulgarian_split_squat-03.mp4",
      "poster": "videos/lib/bulgarian_split_squat-03.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 8.7,
      "sizeBytes": 226348
    }
  ],
  "lib-goblet_squat": [
    {
      "src": "videos/lib/goblet_squat-01.mp4",
      "poster": "videos/lib/goblet_squat-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.6,
      "sizeBytes": 125567
    }
  ],
  "lib-hip_abduction": [
    {
      "src": "videos/lib/hip_abduction-01.mp4",
      "poster": "videos/lib/hip_abduction-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 5.2,
      "sizeBytes": 234383
    }
  ],
  "lib-front_squat": [
    {
      "src": "videos/lib/front_squat-01.mp4",
      "poster": "videos/lib/front_squat-01.jpg",
      "width": 406,
      "height": 720,
      "durationSec": 14.7,
      "sizeBytes": 493164
    }
  ]
}

export const LIBRARY_CATALOG: LibraryExercise[] = [
  {
    "id": "lib-reverse_wrist_curl",
    "nameHe": "פשיטת שורש כף יד",
    "nameEn": "Reverse Wrist Curl",
    "muscleGroup": "forearms",
    "videos": [
      {
        "topic": "FOREARM DAY WITH Gripz If you want bigger forearms, you have to build the extensors, respo",
        "url": "https://www.tiktok.com/@deltabolic/video/7295783247122910470"
      },
      {
        "topic": "If you use a supinated grip and perform wrist curls using a dumbbell, you’ll work the inne",
        "url": "https://www.tiktok.com/@deltabolic/video/7459907816749387014"
      },
      {
        "topic": "Build BIGGER 3D Forearms (with Cable) Flexors: Behind-the-back cable wrist curls Extensors",
        "url": "https://www.tiktok.com/@deltabolic/video/7617947520257330449"
      },
      {
        "topic": "Build BIGGER Forearms with Gripz If you want bigger forearms, you have to work the flexors",
        "url": "https://www.tiktok.com/@deltabolic/video/7658387027435490567"
      }
    ],
    "totalAvailable": 4
  },
  {
    "id": "lib-cable_crunch",
    "nameHe": "כפיפות בטן בכבל",
    "nameEn": "Cable Crunch",
    "muscleGroup": "abs",
    "videos": [
      {
        "topic": "Do cable crunches and declined weighted crunches instead!",
        "url": "https://www.tiktok.com/@deltabolic/video/7095023550712532229"
      },
      {
        "topic": "STOP Making This Cable Crunch MISTAKE!",
        "url": "https://www.tiktok.com/@deltabolic/video/7437651792072117560"
      },
      {
        "topic": "Cable Crunch Mistakes (FIX THESE!) Mistake : Misaligned Forearms Letting your forearms dri",
        "url": "https://www.tiktok.com/@deltabolic/video/7468103892346162437"
      },
      {
        "topic": "com ( ) Don’t Do Cable Crunches Like This!",
        "url": "https://www.tiktok.com/@deltabolic/video/7575749385187904769"
      },
      {
        "topic": "FIX Your Cable Crunch Mistakes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7604296322199391489"
      }
    ],
    "totalAvailable": 5
  },
  {
    "id": "lib-crunch",
    "nameHe": "כפיפות בטן",
    "nameEn": "Crunch",
    "muscleGroup": "abs",
    "videos": [
      {
        "topic": "Tip to make sit-ups much EASIER",
        "url": "https://www.tiktok.com/@deltabolic/video/6803744747321167109"
      },
      {
        "topic": "Stop pulling your neck during ab crunches‼",
        "url": "https://www.tiktok.com/@deltabolic/video/6962030677378288902"
      },
      {
        "topic": "Each move engages your whole core but emphasizes a specific area: 1 ⃣ Weighted Sit-Ups – U",
        "url": "https://www.tiktok.com/@deltabolic/video/7559746349097438480"
      }
    ],
    "totalAvailable": 3
  },
  {
    "id": "lib-plank",
    "nameHe": "פלאנק",
    "nameEn": "Plank",
    "muscleGroup": "abs",
    "videos": [
      {
        "topic": "Keep your butt down when doing planks",
        "url": "https://www.tiktok.com/@deltabolic/video/6792445401698929926"
      },
      {
        "topic": "Slowly progress to an advanced plank and build those abs",
        "url": "https://www.tiktok.com/@deltabolic/video/6954486479980711173"
      },
      {
        "topic": "You're Doing Planks Wrong!",
        "url": "https://www.tiktok.com/@deltabolic/video/7667347978708913409"
      }
    ],
    "totalAvailable": 3
  },
  {
    "id": "lib-leg_raise",
    "nameHe": "הרמת רגליים",
    "nameEn": "Leg Raise",
    "muscleGroup": "abs",
    "videos": [
      {
        "topic": "Stop arching your back during lying leg raises",
        "url": "https://www.tiktok.com/@deltabolic/video/6957400312583818502"
      }
    ],
    "totalAvailable": 1
  },
  {
    "id": "lib-lat_pulldown",
    "nameHe": "משיכת פולי עליון",
    "nameEn": "Lat Pulldown",
    "muscleGroup": "back",
    "videos": [
      {
        "topic": "Stop curling your upper back during lat pull downs",
        "url": "https://www.tiktok.com/@deltabolic/video/6794566377190558981"
      },
      {
        "topic": "Stop using momentum during lat pull downs",
        "url": "https://www.tiktok.com/@deltabolic/video/6797263140359769349"
      },
      {
        "topic": "Can’t feel your back working during lat pull downs?",
        "url": "https://www.tiktok.com/@deltabolic/video/6836012010149399813"
      },
      {
        "topic": "Stop pulling pass shoulder height during last pull downs",
        "url": "https://www.tiktok.com/@deltabolic/video/6876266927292009730"
      },
      {
        "topic": "Stop shrugging your shoulders during lat pull downs‼",
        "url": "https://www.tiktok.com/@deltabolic/video/6914335837224226053"
      },
      {
        "topic": "Do not curve your back during lat pulldowns.",
        "url": "https://www.tiktok.com/@deltabolic/video/6929186547484921093"
      },
      {
        "topic": "Try the neutral grip pulldown variation for back gains",
        "url": "https://www.tiktok.com/@deltabolic/video/6959405308934360326"
      },
      {
        "topic": "STOP making these lat pulldown mistakes",
        "url": "https://www.tiktok.com/@deltabolic/video/6979801348158147846"
      },
      {
        "topic": "AVOID these lat pulldown mistakes if you want to maximize back gains",
        "url": "https://www.tiktok.com/@deltabolic/video/7042721612151508230"
      },
      {
        "topic": "Stop keeping your body fixed in a vertical position during lat pulldowns",
        "url": "https://www.tiktok.com/@deltabolic/video/7077735225157242117"
      },
      {
        "topic": "The Perfect Straight Arm Pulldown",
        "url": "https://www.tiktok.com/@deltabolic/video/7457018519314648326"
      },
      {
        "topic": "FIX THIS Lat Pulldown Mistake!",
        "url": "https://www.tiktok.com/@deltabolic/video/7466596921344314629"
      },
      {
        "topic": "The PERFECT Lat Pulldown (DO THIS!) 1 ⃣ Secure Your Position – Adjust the thigh pad so it ",
        "url": "https://www.tiktok.com/@deltabolic/video/7466985819690044678"
      },
      {
        "topic": "How to Do the Perfect Straight-Arm Pulldown Start by setting the pulley just above head he",
        "url": "https://www.tiktok.com/@deltabolic/video/7498145524617334021"
      },
      {
        "topic": "Lat Pulldown Mistakes (FIX THESE!) 1 ⃣ Loose thigh pad Not securing the thigh pad tightly ",
        "url": "https://www.tiktok.com/@deltabolic/video/7520765204595002629"
      },
      {
        "topic": "DON'T Do Pulldowns Like This A common mistake with neutral grip pulldowns is sitting compl",
        "url": "https://www.tiktok.com/@deltabolic/video/7534127426213874949"
      },
      {
        "topic": "com ( ) FIX THESE LAT PULLDOWN MISTAKES!",
        "url": "https://www.tiktok.com/@deltabolic/video/7549710538276670721"
      },
      {
        "topic": "com ( ) Pulldown Grip Widths & Muscles Worked All grip widths train the entire back to som",
        "url": "https://www.tiktok.com/@deltabolic/video/7578681299326504208"
      },
      {
        "topic": "com ( ) Do Lat Pulldowns LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7586860337199090960"
      },
      {
        "topic": "Do Lat Pulldowns LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7602436025993989393"
      },
      {
        "topic": "official- . You’re Doing Lat Pulldowns WRONG!",
        "url": "https://www.tiktok.com/@deltabolic/video/7606895439022984449"
      },
      {
        "topic": "Stop Using Your Triceps on the Lat Pulldown!",
        "url": "https://www.tiktok.com/@deltabolic/video/7623915507929959697"
      },
      {
        "topic": "Straight-Arm Pulldown COMPLETE Guide",
        "url": "https://www.tiktok.com/@deltabolic/video/7636953632805506320"
      },
      {
        "topic": "Lat Pulldown - Elbows Tucked vs Flared If you tuck in your elbows and drive your elbows to",
        "url": "https://www.tiktok.com/@deltabolic/video/7668819778538081553"
      },
      {
        "topic": "Don’t Do THIS on the Lat Pulldown!",
        "url": "https://www.tiktok.com/@deltabolic/video/7669146131384782096"
      }
    ],
    "totalAvailable": 25
  },
  {
    "id": "lib-seated_cable_row",
    "nameHe": "חתירה בכבל בישיבה",
    "nameEn": "Seated Cable Row",
    "muscleGroup": "back",
    "videos": [
      {
        "topic": "Stop curling your upper back and shrugging during cable rows",
        "url": "https://www.tiktok.com/@deltabolic/video/6798580670210903302"
      },
      {
        "topic": "Stop using momentum during cable rows",
        "url": "https://www.tiktok.com/@deltabolic/video/6798876726765079813"
      },
      {
        "topic": "Maximize back gains with proper cable row form",
        "url": "https://www.tiktok.com/@deltabolic/video/6833979253160250629"
      },
      {
        "topic": "Stop shrugging during cable rows!",
        "url": "https://www.tiktok.com/@deltabolic/video/6882180391109709058"
      },
      {
        "topic": "Stop rolling your shoulders forward during cable rows",
        "url": "https://www.tiktok.com/@deltabolic/video/6932914721142082822"
      },
      {
        "topic": "How different cable row grips puts more focus on certain parts of the back",
        "url": "https://www.tiktok.com/@deltabolic/video/6990344085903019269"
      },
      {
        "topic": "Avoid these cable row mistakes if you want to maximize back gains",
        "url": "https://www.tiktok.com/@deltabolic/video/7073188362173107462"
      },
      {
        "topic": "Stop keeping your shoulders fixed during cable rows",
        "url": "https://www.tiktok.com/@deltabolic/video/7088487931828129029"
      },
      {
        "topic": "When performing cable rows, you engage most of your back muscles, but adjusting your grip ",
        "url": "https://www.tiktok.com/@deltabolic/video/7422064960777243910"
      },
      {
        "topic": "Cable Row Form Tips",
        "url": "https://www.tiktok.com/@deltabolic/video/7424266904874913029"
      },
      {
        "topic": "The PERFECT Cable Row 1 ⃣ Foot Placement Matters – Position your feet higher on the footre",
        "url": "https://www.tiktok.com/@deltabolic/video/7469641856066866438"
      },
      {
        "topic": "A common mistake in the cable row is excessive elbow flexion, which shifts tension from th",
        "url": "https://www.tiktok.com/@deltabolic/video/7474752975735606534"
      },
      {
        "topic": "is having a 7th !",
        "url": "https://www.tiktok.com/@deltabolic/video/7487365850949864709"
      },
      {
        "topic": "Cable Row MISTAKE & How to FIX!",
        "url": "https://www.tiktok.com/@deltabolic/video/7489978807043034373"
      },
      {
        "topic": "Stop Doing Cable Rows Like This!",
        "url": "https://www.tiktok.com/@deltabolic/video/7536391980444552504"
      },
      {
        "topic": "FIX THIS Cable Row Mistake A common mistake on the cable row is keeping your shoulder blad",
        "url": "https://www.tiktok.com/@deltabolic/video/7566102490953862407"
      },
      {
        "topic": "Cable Rows — Leaning Forward vs.",
        "url": "https://www.tiktok.com/@deltabolic/video/7579784401383361793"
      },
      {
        "topic": "com ( ) The PERFECT Cable Row",
        "url": "https://www.tiktok.com/@deltabolic/video/7581633130717531409"
      },
      {
        "topic": "Cable Row Handles & Muscles Worked Single D-Handle — Best for isolating the lats V-Handle ",
        "url": "https://www.tiktok.com/@deltabolic/video/7603928125751282960"
      },
      {
        "topic": "Stop Using Your Biceps on Cable Rows!",
        "url": "https://www.tiktok.com/@deltabolic/video/7624689912972889345"
      },
      {
        "topic": "FIX Your Cable Row Mistakes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7648810467019803922"
      },
      {
        "topic": "Cable Row: How Torso Angle Changes Muscle Emphasis Upright Torso – Targets the lats and mi",
        "url": "https://www.tiktok.com/@deltabolic/video/7666949302685633809"
      }
    ],
    "totalAvailable": 22
  },
  {
    "id": "lib-dumbbell_row",
    "nameHe": "חתירה עם דאמבל",
    "nameEn": "Dumbbell Row",
    "muscleGroup": "back",
    "videos": [
      {
        "topic": "Tip to engage your back muscles during dumbbell rows",
        "url": "https://www.tiktok.com/@deltabolic/video/6796320658994367750"
      },
      {
        "topic": "Stop twisting your body during dumbbell rows",
        "url": "https://www.tiktok.com/@deltabolic/video/6923066112750161158"
      },
      {
        "topic": "Stop shrugging the shoulders during dumbbell rows",
        "url": "https://www.tiktok.com/@deltabolic/video/6949581012150095110"
      },
      {
        "topic": "Stop flaring your elbows during dumbbell rows",
        "url": "https://www.tiktok.com/@deltabolic/video/7060285096460389638"
      },
      {
        "topic": "Stop holding the dumbbell tilted upward like this on the dumbbell row.",
        "url": "https://www.tiktok.com/@deltabolic/video/7286274549044251909"
      },
      {
        "topic": "Dumbell Row Mistake (FIX THIS!) A common mistake in the dumbbell row is excessive elbow fl",
        "url": "https://www.tiktok.com/@deltabolic/video/7458441821534883077"
      },
      {
        "topic": "The PERFECT Dumbbell Row Bench Setup – Use a bench with a slight incline and rest your non",
        "url": "https://www.tiktok.com/@deltabolic/video/7470704668243463479"
      },
      {
        "topic": "DON’T DO THIS on Dumbbell Rows!",
        "url": "https://www.tiktok.com/@deltabolic/video/7505946521154718982"
      },
      {
        "topic": "You're Doing Dumbbell Rows WRONG!",
        "url": "https://www.tiktok.com/@deltabolic/video/7529666692616621368"
      },
      {
        "topic": "com ( ) Dumbbell Row Mistakes You NEED To FIX!",
        "url": "https://www.tiktok.com/@deltabolic/video/7580511543297723664"
      },
      {
        "topic": "Fix THESE Dumbbell Row Mistakes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7601701657616993553"
      },
      {
        "topic": "PERFECT Dumbbell Row (DO THIS!) 1 ⃣ Bench setup Set an incline bench and place your non-wo",
        "url": "https://www.tiktok.com/@deltabolic/video/7606481835203333392"
      },
      {
        "topic": "Dumbbell Row Mistakes You Need to Fix Mistake : Holding the dumbbell too far forward If yo",
        "url": "https://www.tiktok.com/@deltabolic/video/7645412655422835984"
      }
    ],
    "totalAvailable": 13
  },
  {
    "id": "lib-pull_up",
    "nameHe": "מתח",
    "nameEn": "Pull-Up",
    "muscleGroup": "back",
    "videos": [
      {
        "topic": "Stop rolling your shoulders forward and curling your upper back during pull-ups",
        "url": "https://www.tiktok.com/@deltabolic/video/6788223993305451781"
      },
      {
        "topic": "Stop hunching your shoulders during pullups",
        "url": "https://www.tiktok.com/@deltabolic/video/6928445758861479174"
      },
      {
        "topic": "Keep your body tight to do more pull-ups",
        "url": "https://www.tiktok.com/@deltabolic/video/6939653788013825285"
      },
      {
        "topic": "Contract your core for stronger pullups",
        "url": "https://www.tiktok.com/@deltabolic/video/6962541280098307334"
      },
      {
        "topic": "DO THIS to INCREASE your pull-up strength",
        "url": "https://www.tiktok.com/@deltabolic/video/7083665337568201990"
      },
      {
        "topic": "Stop raising your shoulders during pull-ups!",
        "url": "https://www.tiktok.com/@deltabolic/video/7125123003146341638"
      },
      {
        "topic": "6 Form Tips for the Perfect Pull-Up!",
        "url": "https://www.tiktok.com/@deltabolic/video/7398311458833992966"
      },
      {
        "topic": "Pull Up Mistake (DON'T DO THIS!) Stop shrugging your shoulders during pull-ups!",
        "url": "https://www.tiktok.com/@deltabolic/video/7460981588952730886"
      },
      {
        "topic": "STOP Doing This on Pull-Ups!",
        "url": "https://www.tiktok.com/@deltabolic/video/7523356821348732216"
      },
      {
        "topic": "com ( ) Are You Making This Pull-Up Mistake?!",
        "url": "https://www.tiktok.com/@deltabolic/video/7547878291072650512"
      },
      {
        "topic": "DO THIS to Get Your First Pull-Up If you can dead hang for 20 seconds, you should be able ",
        "url": "https://www.tiktok.com/@deltabolic/video/7571300109003033863"
      },
      {
        "topic": "Fix Your Pull-Ups 1 ⃣ Grip width matters Avoid going too narrow or extra wide.",
        "url": "https://www.tiktok.com/@deltabolic/video/7597255014108777744"
      },
      {
        "topic": "Band-Assisted Pull-Up Hack If regular band-assisted pull-ups feel awkward to set up, or yo",
        "url": "https://www.tiktok.com/@deltabolic/video/7619493513616461057"
      }
    ],
    "totalAvailable": 13
  },
  {
    "id": "lib-row_general",
    "nameHe": "חתירה",
    "nameEn": "Row (general)",
    "muscleGroup": "back",
    "videos": [
      {
        "topic": "Maximize back muscle gains with proper back row form",
        "url": "https://www.tiktok.com/@deltabolic/video/6782990225808329989"
      },
      {
        "topic": "Keep your arms close to your body during back rows",
        "url": "https://www.tiktok.com/@deltabolic/video/6837139195862142214"
      },
      {
        "topic": "Stop moving your body excessively during back rows",
        "url": "https://www.tiktok.com/@deltabolic/video/6837340674216545541"
      },
      {
        "topic": "Keep your forearms pointing straight down during back rows",
        "url": "https://www.tiktok.com/@deltabolic/video/6844750286926515462"
      },
      {
        "topic": "Stop pulling up toward your shoulders during back rows.",
        "url": "https://www.tiktok.com/@deltabolic/video/6920039508033490181"
      },
      {
        "topic": "Don’t your back during back rows",
        "url": "https://www.tiktok.com/@deltabolic/video/6935650297612160261"
      },
      {
        "topic": "When performing a barbell back row, nearly all the muscles in your back are engaged.",
        "url": "https://www.tiktok.com/@deltabolic/video/7421720090368052485"
      },
      {
        "topic": "com ( ) .official - .",
        "url": "https://www.tiktok.com/@deltabolic/video/7610989043110743297"
      }
    ],
    "totalAvailable": 8
  },
  {
    "id": "lib-barbell_row",
    "nameHe": "חתירה במוט",
    "nameEn": "Barbell Row",
    "muscleGroup": "back",
    "videos": [
      {
        "topic": "Stop raising your shoulders during barbell rows!",
        "url": "https://www.tiktok.com/@deltabolic/video/6841377325066489093"
      },
      {
        "topic": "Keep your shoulders retracted during barbell rows",
        "url": "https://www.tiktok.com/@deltabolic/video/6875851740332264705"
      },
      {
        "topic": "Stop raising your shoulders during barbell rows‼",
        "url": "https://www.tiktok.com/@deltabolic/video/6915862715634371846"
      },
      {
        "topic": "Muscles worked for each barbell rows grip",
        "url": "https://www.tiktok.com/@deltabolic/video/6940114971971947781"
      },
      {
        "topic": "STOP standing upright during barbell rows",
        "url": "https://www.tiktok.com/@deltabolic/video/7080232311937092870"
      },
      {
        "topic": "The PERFECT Barbell Row 1 ⃣ Use a grip slightly wider than shoulder-width 2 ⃣ Hinge to a 4",
        "url": "https://www.tiktok.com/@deltabolic/video/7492201739781737783"
      },
      {
        "topic": "com ( ) Barbell Row Grip Widths & Muscle Emphasis Barbell rows work the entire back, but g",
        "url": "https://www.tiktok.com/@deltabolic/video/7552329398830075137"
      },
      {
        "topic": "Barbell Row Grip Width & Muscles Worked Grip width and hand position can change which back",
        "url": "https://www.tiktok.com/@deltabolic/video/7647317001727167761"
      }
    ],
    "totalAvailable": 8
  },
  {
    "id": "lib-deadlift",
    "nameHe": "דדליפט",
    "nameEn": "Deadlift",
    "muscleGroup": "back",
    "videos": [
      {
        "topic": "Keep your back straight when deadlifting",
        "url": "https://www.tiktok.com/@deltabolic/video/6786889600754273541"
      },
      {
        "topic": "Increase your deadlift instantly with this simple tip",
        "url": "https://www.tiktok.com/@deltabolic/video/6909860143152762118"
      },
      {
        "topic": "Deadlift: Muscles worked",
        "url": "https://www.tiktok.com/@deltabolic/video/6948583672425532678"
      },
      {
        "topic": "DO THIS for a stronger, safer deadlift",
        "url": "https://www.tiktok.com/@deltabolic/video/7094330932672367878"
      },
      {
        "topic": "Use . The PERFECT Deadlift (DO THIS!) 1 ⃣ Stance – Keep your feet hip-width apart for opti",
        "url": "https://www.tiktok.com/@deltabolic/video/7467343059844549894"
      },
      {
        "topic": "The Most Confusing Deadlift Mistake You Need to Fix One of the most common—and hardest to ",
        "url": "https://www.tiktok.com/@deltabolic/video/7538947864047799557"
      },
      {
        "topic": "The PERFECT Deadlift Guide 1 ⃣ Stand with your feet hip-width apart 2 ⃣ Roll the bar towar",
        "url": "https://www.tiktok.com/@deltabolic/video/7613564265810758913"
      }
    ],
    "totalAvailable": 7
  },
  {
    "id": "lib-romanian_deadlift",
    "nameHe": "דדליפט רומני",
    "nameEn": "Romanian Deadlift",
    "muscleGroup": "back",
    "videos": [
      {
        "topic": "Don't Make This Romanian Deadlife Mistake!",
        "url": "https://www.tiktok.com/@deltabolic/video/7613928915077221648"
      },
      {
        "topic": "official - . The PERFECT Dumbbell Romanian Deadlift",
        "url": "https://www.tiktok.com/@deltabolic/video/7623180331281042704"
      },
      {
        "topic": "The PERFECT Dumbbell Romanian Deadlift",
        "url": "https://www.tiktok.com/@deltabolic/video/7651020060361870609"
      }
    ],
    "totalAvailable": 3
  },
  {
    "id": "lib-back_extension",
    "nameHe": "הרמת גב",
    "nameEn": "Back Extension",
    "muscleGroup": "back",
    "videos": [
      {
        "topic": "The 7TH .com! Launches Monday, March 24 ⏰ 7 PM GMT | 3 PM EDT | 8 PM CET Hyperextension (K",
        "url": "https://www.tiktok.com/@deltabolic/video/7484788206039207173"
      },
      {
        "topic": "com ( ) Don't DO THIS on the Hyperextension!",
        "url": "https://www.tiktok.com/@deltabolic/video/7543432540804107526"
      },
      {
        "topic": "com ( ) Hyperextensions: Lower Back vs Glutes • Neutral spine hyperextensions primarily ta",
        "url": "https://www.tiktok.com/@deltabolic/video/7592043985808395521"
      }
    ],
    "totalAvailable": 3
  },
  {
    "id": "lib-t_bar_row",
    "nameHe": "חתירת טי-בר",
    "nameEn": "T-Bar Row",
    "muscleGroup": "back",
    "videos": [
      {
        "topic": "Best T-Bar Row Alternative?",
        "url": "https://www.tiktok.com/@deltabolic/video/7661394623515856144"
      },
      {
        "topic": "No supported t-bar row machine at your gym?",
        "url": "https://www.tiktok.com/@deltabolic/video/7666591410031774977"
      }
    ],
    "totalAvailable": 2
  },
  {
    "id": "lib-landmine_row",
    "nameHe": "חתירת לנדמיין",
    "nameEn": "Landmine Row",
    "muscleGroup": "back",
    "videos": [
      {
        "topic": "The PERFECT Landmine Row 1 ⃣ Use a thumbless grip – this shifts more load to your back mus",
        "url": "https://www.tiktok.com/@deltabolic/video/7539352350914366776"
      },
      {
        "topic": "Landmine Rows — Know the Difference!",
        "url": "https://www.tiktok.com/@deltabolic/video/7602038520240295185"
      }
    ],
    "totalAvailable": 2
  },
  {
    "id": "lib-machine_row",
    "nameHe": "חתירה במכונה",
    "nameEn": "Machine Row",
    "muscleGroup": "back",
    "videos": [
      {
        "topic": "Archer Row Hack Instead of gripping the cable stopper ball, attach a lifting strap for a m",
        "url": "https://www.tiktok.com/@deltabolic/video/7663991412198755600"
      }
    ],
    "totalAvailable": 1
  },
  {
    "id": "lib-straight_arm_pulldown",
    "nameHe": "משיכה בזרועות ישרות",
    "nameEn": "Straight-Arm Pulldown",
    "muscleGroup": "back",
    "videos": [
      {
        "topic": "Visit the link in my bio for full training plan with form tips!",
        "url": "https://www.tiktok.com/@deltabolic/video/7260212575059627269"
      }
    ],
    "totalAvailable": 1
  },
  {
    "id": "lib-barbell_bench_press",
    "nameHe": "לחיצת חזה במוט",
    "nameEn": "Barbell Bench Press",
    "muscleGroup": "chest",
    "videos": [
      {
        "topic": "Make bigger chest gains with proper bench press form",
        "url": "https://www.tiktok.com/@deltabolic/video/6784474928583412998"
      },
      {
        "topic": "Science-backed method to increasing your bench press",
        "url": "https://www.tiktok.com/@deltabolic/video/6802457097041661189"
      },
      {
        "topic": "Avoid flaring your elbows excessively during bench press to avoid shoulder and elbow injur",
        "url": "https://www.tiktok.com/@deltabolic/video/6850500375129181445"
      },
      {
        "topic": "STOP making these bench press mistakes",
        "url": "https://www.tiktok.com/@deltabolic/video/7010560950424079621"
      },
      {
        "topic": "Do a bodybuilding style bench press Energy",
        "url": "https://www.tiktok.com/@deltabolic/video/7044930934994406661"
      },
      {
        "topic": "DO THIS to INCREASE your bench press‼",
        "url": "https://www.tiktok.com/@deltabolic/video/7083929514803318021"
      },
      {
        "topic": "STOP Bench Pressing LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7109570405320445189"
      },
      {
        "topic": "DO THIS to maximize bench press strength",
        "url": "https://www.tiktok.com/@deltabolic/video/7118086821459791110"
      },
      {
        "topic": "Stop bending your wrist too far back!",
        "url": "https://www.tiktok.com/@deltabolic/video/7130325423270989061"
      },
      {
        "topic": "STOP locking out your elbows during bench press!",
        "url": "https://www.tiktok.com/@deltabolic/video/7163747668102089989"
      },
      {
        "topic": "STOP pointing your forearms inward or outward during bench press!",
        "url": "https://www.tiktok.com/@deltabolic/video/7181621307883228422"
      },
      {
        "topic": "STOP bench pressing with a flat back!",
        "url": "https://www.tiktok.com/@deltabolic/video/7217526595261680902"
      },
      {
        "topic": "STOP lowering the bar down to your upper chest during bench press!",
        "url": "https://www.tiktok.com/@deltabolic/video/7218280491416358149"
      },
      {
        "topic": "MAXIMIZE YOUR BENCH PRESS STRENGTH by following these 4 tips!",
        "url": "https://www.tiktok.com/@deltabolic/video/7243972025310596357"
      },
      {
        "topic": "AVOID placing the bar too high on the palm of your hand Rest the bar on the base of the pa",
        "url": "https://www.tiktok.com/@deltabolic/video/7244334326920400133"
      },
      {
        "topic": "STOP FLARING YOUR ELBOWS during bench press!",
        "url": "https://www.tiktok.com/@deltabolic/video/7255380351885905157"
      },
      {
        "topic": "STOP locking out your elbows on the bench press!",
        "url": "https://www.tiktok.com/@deltabolic/video/7328124394126068997"
      },
      {
        "topic": "Follow these 6 form tips for the perfect bench press.",
        "url": "https://www.tiktok.com/@deltabolic/video/7397902693160766726"
      },
      {
        "topic": "Varying your bench press grip width shifts the focus on different muscle groups.",
        "url": "https://www.tiktok.com/@deltabolic/video/7414268303373290757"
      },
      {
        "topic": "Bench Press Grips & Muscles Worked!",
        "url": "https://www.tiktok.com/@deltabolic/video/7434700869674765623"
      },
      {
        "topic": "DON'T DO THIS on the Bench Press A common bench press mistake is pressing the bar in a str",
        "url": "https://www.tiktok.com/@deltabolic/video/7479207603302714630"
      },
      {
        "topic": "com Bench Press Grips Explained (KNOW THE DIFFERENCE!) Close Grip: More triceps activation",
        "url": "https://www.tiktok.com/@deltabolic/video/7522644417556122936"
      },
      {
        "topic": "com ( ) How to Perform the PERFECT Bench Press",
        "url": "https://www.tiktok.com/@deltabolic/video/7548628092017921281"
      },
      {
        "topic": "For my .com ( ) Don’t Do THIS on the Bench Press!",
        "url": "https://www.tiktok.com/@deltabolic/video/7575714272005688592"
      },
      {
        "topic": "com ( ) FIX THESE BENCH PRESS MISTAKES!",
        "url": "https://www.tiktok.com/@deltabolic/video/7577905654845787409"
      },
      {
        "topic": "com ( ) Bench Press Grip Widths & Muscles Worked Any bench press grip will train your ches",
        "url": "https://www.tiktok.com/@deltabolic/video/7580924307560254736"
      },
      {
        "topic": "com ( ) DON’T DO THIS on the Bench Press!",
        "url": "https://www.tiktok.com/@deltabolic/video/7585742931269520641"
      },
      {
        "topic": "com ( ) Bench Press Angles & Muscles Worked • Flat bench emphasizes the mid-to-lower chest",
        "url": "https://www.tiktok.com/@deltabolic/video/7591650240193662209"
      },
      {
        "topic": "com ( ) Bench Press Form Guide 1 ⃣ Before unracking, align your eyes directly under the ba",
        "url": "https://www.tiktok.com/@deltabolic/video/7607635914105326849"
      },
      {
        "topic": "How to Perform the Perfect Close-Grip Bench Press 1 ⃣ Grip the bar slightly narrower than ",
        "url": "https://www.tiktok.com/@deltabolic/video/7614352185425415440"
      },
      {
        "topic": "Fix Your Bench Press!",
        "url": "https://www.tiktok.com/@deltabolic/video/7625058981471472913"
      },
      {
        "topic": "Bench Press Grip Widths (KNOW THE DIFFERENCE!) Wide Grip – more chest involvement, but als",
        "url": "https://www.tiktok.com/@deltabolic/video/7629078578323393808"
      },
      {
        "topic": "STOP Benching LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7630589025400753415"
      },
      {
        "topic": "How to Bench Press with Proper Form",
        "url": "https://www.tiktok.com/@deltabolic/video/7669972558665501953"
      }
    ],
    "totalAvailable": 34
  },
  {
    "id": "lib-push_up",
    "nameHe": "שכיבות סמיכה",
    "nameEn": "Push-Up",
    "muscleGroup": "chest",
    "videos": [
      {
        "topic": "Stop shrugging your shoulders!",
        "url": "https://www.tiktok.com/@deltabolic/video/6794834783642946821"
      },
      {
        "topic": "Maximize chest gains with perfect form pushups!",
        "url": "https://www.tiktok.com/@deltabolic/video/6795563943436897542"
      },
      {
        "topic": "Stop shrugging your shoulders during pushups",
        "url": "https://www.tiktok.com/@deltabolic/video/6871836169093598466"
      },
      {
        "topic": "Stop flaring your elbows directly to the side during pushups!",
        "url": "https://www.tiktok.com/@deltabolic/video/6877756510533963010"
      },
      {
        "topic": "Again stop flaring out your elbows to the side during pushups!",
        "url": "https://www.tiktok.com/@deltabolic/video/6878138606205029634"
      },
      {
        "topic": "Reply to How To Do The PERFECT Diamond Push-up",
        "url": "https://www.tiktok.com/@deltabolic/video/6896368256680987905"
      },
      {
        "topic": "Fix your diamonds push-ups to maximize tricep gains‼",
        "url": "https://www.tiktok.com/@deltabolic/video/6896944871949520129"
      },
      {
        "topic": "Stop hunching your shoulders during pushups",
        "url": "https://www.tiktok.com/@deltabolic/video/6959737224413891846"
      },
      {
        "topic": "Progress your push-up strength",
        "url": "https://www.tiktok.com/@deltabolic/video/6967379593871346949"
      },
      {
        "topic": "AVOID this push-up mistake‼",
        "url": "https://www.tiktok.com/@deltabolic/video/7034598739608161541"
      },
      {
        "topic": "Avoid these push-up mistakes to avoid shoulder injury",
        "url": "https://www.tiktok.com/@deltabolic/video/7037528483727297797"
      },
      {
        "topic": "Do THIS instead if your elbows hurt during diamond pushups",
        "url": "https://www.tiktok.com/@deltabolic/video/7076961061554916613"
      },
      {
        "topic": "Find your optimal hand placement to increase your pushups",
        "url": "https://www.tiktok.com/@deltabolic/video/7099083492172074245"
      },
      {
        "topic": "STOP SAGGING YOUR HIPS during pushups!",
        "url": "https://www.tiktok.com/@deltabolic/video/7112140865438616837"
      },
      {
        "topic": "STOP Tilting your forearms to the side during pushups",
        "url": "https://www.tiktok.com/@deltabolic/video/7116190252217175302"
      },
      {
        "topic": "STOP RAISING YOUR SHOULDERS DURING PUSHUPS",
        "url": "https://www.tiktok.com/@deltabolic/video/7122610008826580229"
      },
      {
        "topic": "STOP doing push-ups with your arms at 90 degree angle!",
        "url": "https://www.tiktok.com/@deltabolic/video/7170072779159588102"
      },
      {
        "topic": "STOP raising your shoulders during pushups!",
        "url": "https://www.tiktok.com/@deltabolic/video/7229117703041174790"
      },
      {
        "topic": "Stop doing pushups like this, with the elbows pointing directly to the side and the arms a",
        "url": "https://www.tiktok.com/@deltabolic/video/7314024919380069638"
      },
      {
        "topic": "A pushup mistake is rolling your shoulders forward, causing the shoulders to do more work ",
        "url": "https://www.tiktok.com/@deltabolic/video/7347829721402592517"
      },
      {
        "topic": "Push-Up Mistakes (and How to Fix Them) Mistake : Using a Wide Hand Placement Placing your ",
        "url": "https://www.tiktok.com/@deltabolic/video/7438795388674395448"
      },
      {
        "topic": "Don't Do Pushups Like This!",
        "url": "https://www.tiktok.com/@deltabolic/video/7495175866750668038"
      },
      {
        "topic": "Common Pushup Mistake Moving straight up and down with your elbows flared out at a 90° ang",
        "url": "https://www.tiktok.com/@deltabolic/video/7512243231275371832"
      },
      {
        "topic": "Don’t Do Pushups LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7532226254997556486"
      },
      {
        "topic": "com ( ) Don’t Do Push-Ups Like This!",
        "url": "https://www.tiktok.com/@deltabolic/video/7581595657069169936"
      },
      {
        "topic": "com Do Push-Ups LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7585770367348673793"
      },
      {
        "topic": "Fix THESE Pushup Mistakes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7643218736144452880"
      }
    ],
    "totalAvailable": 27
  },
  {
    "id": "lib-cable_chest_fly",
    "nameHe": "פרפר בכבלים",
    "nameEn": "Cable Chest Fly",
    "muscleGroup": "chest",
    "videos": [
      {
        "topic": "Keep your arms below shoulder height when doing chest flyes",
        "url": "https://www.tiktok.com/@deltabolic/video/6790903766179794181"
      },
      {
        "topic": "STOP rolling your shoulders forward during cable chest flyes",
        "url": "https://www.tiktok.com/@deltabolic/video/6799316632780000517"
      },
      {
        "topic": "Stop crashing the dumbbells together during chest flyes!",
        "url": "https://www.tiktok.com/@deltabolic/video/6845839320419454213"
      },
      {
        "topic": "Keep your arms slightly bent during chest flyes .",
        "url": "https://www.tiktok.com/@deltabolic/video/6880363767008365825"
      },
      {
        "topic": "Do not roll your shoulders forward during chest flyes",
        "url": "https://www.tiktok.com/@deltabolic/video/6922951610050039045"
      },
      {
        "topic": "How to target the upper, middle and lower chest on cable flyes",
        "url": "https://www.tiktok.com/@deltabolic/video/6938251772188232965"
      },
      {
        "topic": "STOP leaning and rolling your shoulders forward during machine chest flyes",
        "url": "https://www.tiktok.com/@deltabolic/video/7108868873427963142"
      },
      {
        "topic": "STOP raising your shoulders during cable flyes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7207526446108134662"
      },
      {
        "topic": "THIS is how you can target the upper, middle and lower regions of your chest on the chest ",
        "url": "https://www.tiktok.com/@deltabolic/video/7365656098050788614"
      },
      {
        "topic": "FIX THESE Dumbbell Chest Fly Mistakes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7451447029680704773"
      },
      {
        "topic": "Cable Chest Fly Mistakes and How to Fix Them",
        "url": "https://www.tiktok.com/@deltabolic/video/7461723210766142726"
      },
      {
        "topic": "You're Doing Machine Chest Flyes WRONG!",
        "url": "https://www.tiktok.com/@deltabolic/video/7508543918905036038"
      },
      {
        "topic": "You're Doing Dumbbell Chest Flyes WRONG!",
        "url": "https://www.tiktok.com/@deltabolic/video/7529312860468563205"
      },
      {
        "topic": "com ( ) Cable Chest Fly Angles: Know the Difference!",
        "url": "https://www.tiktok.com/@deltabolic/video/7540072211021860101"
      },
      {
        "topic": "com ( ) The PERFECT Cable Chest Fly",
        "url": "https://www.tiktok.com/@deltabolic/video/7554529864800374017"
      },
      {
        "topic": "Cable Chest Flyes – Know the Difference!",
        "url": "https://www.tiktok.com/@deltabolic/video/7577536489513323793"
      },
      {
        "topic": "Do Chest Flyes LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7590187882011282689"
      },
      {
        "topic": "How to do the PERFECT Cable Chest Fly",
        "url": "https://www.tiktok.com/@deltabolic/video/7605028394262220049"
      },
      {
        "topic": "How to Perform the PERFECT Machine Chest Fly 1 ⃣ Grip the handles with your palms facing f",
        "url": "https://www.tiktok.com/@deltabolic/video/7614683044384951553"
      },
      {
        "topic": "Machine Chest Fly Mistakes Mistake : Keeping your elbows level with your shoulders This ca",
        "url": "https://www.tiktok.com/@deltabolic/video/7664414076881128721"
      },
      {
        "topic": "Fix THESE Cable Chest Fly Mistakes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7666620266960801040"
      }
    ],
    "totalAvailable": 21
  },
  {
    "id": "lib-dumbbell_bench_press",
    "nameHe": "לחיצת חזה בדאמבלים",
    "nameEn": "Dumbbell Bench Press",
    "muscleGroup": "chest",
    "videos": [
      {
        "topic": "Stop rolling your shoulders forward during dumbbell presses!",
        "url": "https://www.tiktok.com/@deltabolic/video/6848274047575395590"
      },
      {
        "topic": "Stop shrugging your shoulders during dumbbell chest press!",
        "url": "https://www.tiktok.com/@deltabolic/video/6893360817505324290"
      },
      {
        "topic": "Stop tilting the dumbbells inward during dumbbell chest press",
        "url": "https://www.tiktok.com/@deltabolic/video/6968502750992764165"
      },
      {
        "topic": "STOP locking out your elbows during dumbbell bench press",
        "url": "https://www.tiktok.com/@deltabolic/video/7063115330805058821"
      },
      {
        "topic": "When performing a flat dumbbell bench press, you primarily target the entire chest, with s",
        "url": "https://www.tiktok.com/@deltabolic/video/7417236336177843462"
      },
      {
        "topic": "Dumbell Chest Press Mistake (STOP DOING THIS!) A common but subtle mistake in the dumbbell",
        "url": "https://www.tiktok.com/@deltabolic/video/7477003696220409093"
      },
      {
        "topic": "The PERFECT Incline Dumbbell Chest Press 1 ⃣ Set the Bench Right – A 30-degree incline is ",
        "url": "https://www.tiktok.com/@deltabolic/video/7477778832280358199"
      },
      {
        "topic": "Dumbbell Chest Press Mistakes (DON'T DO THIS!) Mistake : Banging the dumbbells together at",
        "url": "https://www.tiktok.com/@deltabolic/video/7510763723070508294"
      },
      {
        "topic": "com ( ) STOP Making This Chest Press Mistake!",
        "url": "https://www.tiktok.com/@deltabolic/video/7555287399853526288"
      },
      {
        "topic": "com ( ) STOP Doing This on the Dumbbell Chest Press!",
        "url": "https://www.tiktok.com/@deltabolic/video/7557884273689120001"
      },
      {
        "topic": "The PERFECT Dumbbell Chest Press 1 ⃣ Roll your shoulders back and keep your chest up.",
        "url": "https://www.tiktok.com/@deltabolic/video/7564918676189662481"
      },
      {
        "topic": "Don’t Do Dumbbell Chest Press Like This!",
        "url": "https://www.tiktok.com/@deltabolic/video/7622766689603685633"
      }
    ],
    "totalAvailable": 12
  },
  {
    "id": "lib-incline_barbell_bench_press",
    "nameHe": "לחיצת חזה במוט בשיפוע חיובי",
    "nameEn": "Incline Barbell Bench Press",
    "muscleGroup": "chest",
    "videos": [
      {
        "topic": "Your elbows shouldn’t flare out to the side during incline bench press",
        "url": "https://www.tiktok.com/@deltabolic/video/6918786348908285190"
      },
      {
        "topic": "STOP moving the bar in a vertically straight path during incline bench press!",
        "url": "https://www.tiktok.com/@deltabolic/video/7152909508564618502"
      },
      {
        "topic": "DO THIS to Build a BIGGER Chest!",
        "url": "https://www.tiktok.com/@deltabolic/video/7521871455823465734"
      },
      {
        "topic": "Incline Bench Press LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7586097722780912912"
      },
      {
        "topic": "official . Do Incline Bench Press LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7653669237667482896"
      }
    ],
    "totalAvailable": 5
  },
  {
    "id": "lib-machine_chest_press",
    "nameHe": "לחיצת חזה במכונה",
    "nameEn": "Machine Chest Press",
    "muscleGroup": "chest",
    "videos": [
      {
        "topic": "Stop pushing with your shoulders on any chest press machine!",
        "url": "https://www.tiktok.com/@deltabolic/video/7099827088944827654"
      },
      {
        "topic": "STOP flaring your elbows out too high to the side on ANY chest press machine!",
        "url": "https://www.tiktok.com/@deltabolic/video/7233547067174538501"
      },
      {
        "topic": "The PERFECT Machine Chest Press",
        "url": "https://www.tiktok.com/@deltabolic/video/7476622329020304695"
      },
      {
        "topic": ") If you lean forward on the chest press machine, you'll target more of your upper chest a",
        "url": "https://www.tiktok.com/@deltabolic/video/7498521434327682310"
      },
      {
        "topic": "How to Do the PERFECT Machine Chest Press",
        "url": "https://www.tiktok.com/@deltabolic/video/7603190204740013313"
      }
    ],
    "totalAvailable": 5
  },
  {
    "id": "lib-dumbbell_chest_fly",
    "nameHe": "פרפר עם דאמבלים",
    "nameEn": "Dumbbell Chest Fly",
    "muscleGroup": "chest",
    "videos": [
      {
        "topic": "Stop doing dumbbell flyes like this",
        "url": "https://www.tiktok.com/@deltabolic/video/7066830332456160517"
      },
      {
        "topic": "STOP rolling your shoulders forward during dumbbell flys!",
        "url": "https://www.tiktok.com/@deltabolic/video/7075361576848542982"
      },
      {
        "topic": "Don’t keep your arm straight during dumbbell flyes",
        "url": "https://www.tiktok.com/@deltabolic/video/7134813165828820230"
      },
      {
        "topic": "AVOID THIS MISTAKE on the Dumbbell Fly!",
        "url": "https://www.tiktok.com/@deltabolic/video/7482506524871380279"
      },
      {
        "topic": "You’re Doing Dumbbell Flyes Wrong!",
        "url": "https://www.tiktok.com/@deltabolic/video/7622835195439320337"
      }
    ],
    "totalAvailable": 5
  },
  {
    "id": "lib-pec_deck_machine_chest_fly",
    "nameHe": "פרפר במכונה",
    "nameEn": "Pec Deck / Machine Chest Fly",
    "muscleGroup": "chest",
    "videos": [
      {
        "topic": "FIX THESE Pec Deck Fly Mistakes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7434281969627794744"
      },
      {
        "topic": "The PERFECT Pec Deck Fly 1 ⃣ Neutral Grip – Hold the handles with a neutral wrist.",
        "url": "https://www.tiktok.com/@deltabolic/video/7524499936168217912"
      },
      {
        "topic": "Pec Fly Mistake Don’t keep your arms completely straight at the start of the pec fly machi",
        "url": "https://www.tiktok.com/@deltabolic/video/7634309918157196560"
      },
      {
        "topic": "Pec Deck Machine Fly Mistakes The first mistake is keeping your arms completely straight.",
        "url": "https://www.tiktok.com/@deltabolic/video/7657695073634651409"
      }
    ],
    "totalAvailable": 4
  },
  {
    "id": "lib-smith_machine_bench_press",
    "nameHe": "לחיצת חזה בסמית'",
    "nameEn": "Smith Machine Bench Press",
    "muscleGroup": "chest",
    "videos": [
      {
        "topic": "The PERFECT Incline Smith Machine Bench Press 1 ⃣ Grip Width: Use a grip about 1.5× should",
        "url": "https://www.tiktok.com/@deltabolic/video/7537096458382708024"
      },
      {
        "topic": "Smith Machine Bench Press Guide",
        "url": "https://www.tiktok.com/@deltabolic/video/7619790941406203137"
      }
    ],
    "totalAvailable": 2
  },
  {
    "id": "lib-incline_dumbbell_press",
    "nameHe": "לחיצת חזה בדאמבלים בשיפוע",
    "nameEn": "Incline Dumbbell Press",
    "muscleGroup": "chest",
    "videos": [
      {
        "topic": "Incline Dumbbell Press Guide",
        "url": "https://www.tiktok.com/@deltabolic/video/7616907152652782849"
      }
    ],
    "totalAvailable": 1
  },
  {
    "id": "lib-cable_chest_press",
    "nameHe": "לחיצת חזה בכבלים",
    "nameEn": "Cable Chest Press",
    "muscleGroup": "chest",
    "videos": [
      {
        "topic": "Do Cable Chest Presses LIKE THIS High-to-Low Cable Chest Press – emphasizes the lower ches",
        "url": "https://www.tiktok.com/@deltabolic/video/7598752637315566864"
      }
    ],
    "totalAvailable": 1
  },
  {
    "id": "lib-pullover",
    "nameHe": "פולאובר",
    "nameEn": "Pullover",
    "muscleGroup": "chest",
    "videos": [
      {
        "topic": "You're Doing Dumbbell Pullovers WRONG!",
        "url": "https://www.tiktok.com/@deltabolic/video/7521169369930484998"
      }
    ],
    "totalAvailable": 1
  },
  {
    "id": "lib-triceps_pushdown",
    "nameHe": "פשיטת מרפקים בפולי",
    "nameEn": "Triceps Pushdown",
    "muscleGroup": "triceps",
    "videos": [
      {
        "topic": "Killer triceps extensions for MASSIVE tricep gains",
        "url": "https://www.tiktok.com/@deltabolic/video/6772606675254889733"
      },
      {
        "topic": "Stop flaring your elbow excessive during cable tricep extensions",
        "url": "https://www.tiktok.com/@deltabolic/video/6834137987824110853"
      },
      {
        "topic": "Avoid excessive elbow flaring during overhead dumbbell tricep extensions",
        "url": "https://www.tiktok.com/@deltabolic/video/6917340420728950022"
      },
      {
        "topic": "Do not lean to one side of the cables during tricep pushdowns",
        "url": "https://www.tiktok.com/@deltabolic/video/6953634043225230597"
      },
      {
        "topic": "Stop flaring your elbows during tricep extensions",
        "url": "https://www.tiktok.com/@deltabolic/video/6964353766481005830"
      },
      {
        "topic": "Avoid this tricep pushdown mistake",
        "url": "https://www.tiktok.com/@deltabolic/video/7004823704802807046"
      },
      {
        "topic": "Stop doing lying tricep extensions with your arms 90 degree from your body",
        "url": "https://www.tiktok.com/@deltabolic/video/7058052021340900613"
      },
      {
        "topic": "FIX THESE tricep pushdown mistakes for greater triceps gains",
        "url": "https://www.tiktok.com/@deltabolic/video/7076548166153293062"
      },
      {
        "topic": "STOP MOVING YOUR UPPER ARM DURING TRICEP PUSHDOWNS",
        "url": "https://www.tiktok.com/@deltabolic/video/7107353752646061317"
      },
      {
        "topic": "STOP bending your wrist back during tricep pushdowns using a straight bar!",
        "url": "https://www.tiktok.com/@deltabolic/video/7162576083634670854"
      },
      {
        "topic": "Triceps Pushdown Form Tips",
        "url": "https://www.tiktok.com/@deltabolic/video/7442112157812018488"
      },
      {
        "topic": "STOP Making This Triceps Pushdown MISTAKE!",
        "url": "https://www.tiktok.com/@deltabolic/video/7469947235472559365"
      },
      {
        "topic": "com ( ) The PERFECT Triceps Pushdown",
        "url": "https://www.tiktok.com/@deltabolic/video/7576415685601955088"
      },
      {
        "topic": "official- . .com ( ) Triceps Pushdown Mistakes You NEED to Fix Mistake : Standing complete",
        "url": "https://www.tiktok.com/@deltabolic/video/7583524931938340112"
      },
      {
        "topic": "Triceps Pushdown Mistake (FIX THIS!) .com ( ) Stop raising your shoulders and lowering the",
        "url": "https://www.tiktok.com/@deltabolic/video/7593546488089709825"
      },
      {
        "topic": "Overhead Dumbbell Triceps Extension Guide",
        "url": "https://www.tiktok.com/@deltabolic/video/7621359575739960577"
      },
      {
        "topic": "official - . Do Triceps Pushdown LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7640615507942575377"
      }
    ],
    "totalAvailable": 17
  },
  {
    "id": "lib-skull_crusher",
    "nameHe": "סקאל קראשר",
    "nameEn": "Skull Crusher",
    "muscleGroup": "triceps",
    "videos": [
      {
        "topic": "Stop flaring your elbows during skull crushers for max tricep gains",
        "url": "https://www.tiktok.com/@deltabolic/video/6800442906021776646"
      },
      {
        "topic": "Avoid flaring your elbows excessively during skull crushers",
        "url": "https://www.tiktok.com/@deltabolic/video/6827979579081100549"
      },
      {
        "topic": "Stop doing skull crushers with your upper arm pointing straight up‼",
        "url": "https://www.tiktok.com/@deltabolic/video/6900394925205097729"
      },
      {
        "topic": "Stop doing skull crushers like this: lowering the barbell down to your forehead since this",
        "url": "https://www.tiktok.com/@deltabolic/video/7249901910860320006"
      },
      {
        "topic": "The Perfect Lying Triceps Extension (DO THIS!)",
        "url": "https://www.tiktok.com/@deltabolic/video/7448419159626484998"
      },
      {
        "topic": "Lying Tricep Extension Mistake (DON'T DO THIS!) When performing lying triceps extensions, ",
        "url": "https://www.tiktok.com/@deltabolic/video/7481056083109285125"
      },
      {
        "topic": "The PERFECT Skull Crusher Tip : a thumbless grip — this makes it easier to keep your elbow",
        "url": "https://www.tiktok.com/@deltabolic/video/7580540364319132945"
      },
      {
        "topic": "FIX Your Lying Triceps Extension!",
        "url": "https://www.tiktok.com/@deltabolic/video/7604656042290515201"
      },
      {
        "topic": "STOP Doing Skull Crushers LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7612098282692611345"
      },
      {
        "topic": "Fix Your Lying Triceps Extensions!",
        "url": "https://www.tiktok.com/@deltabolic/video/7636116644674161921"
      }
    ],
    "totalAvailable": 10
  },
  {
    "id": "lib-overhead_triceps_extension",
    "nameHe": "פשיטת מרפקים מעל הראש",
    "nameEn": "Overhead Triceps Extension",
    "muscleGroup": "triceps",
    "videos": [
      {
        "topic": "Try incline overhead tricep extension to maximize tension for tricep gainz‼",
        "url": "https://www.tiktok.com/@deltabolic/video/6898166191987133697"
      },
      {
        "topic": "Do Overhead Cable Tricep Extensions LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7480305604393749815"
      },
      {
        "topic": "The PERFECT Low Pulley Overhead Extensions 1 ⃣ Set the cable rope just above your waist (a",
        "url": "https://www.tiktok.com/@deltabolic/video/7488861025236798775"
      },
      {
        "topic": "Single-Arm Overhead Triceps Extension — Common Mistakes",
        "url": "https://www.tiktok.com/@deltabolic/video/7573793551511768336"
      },
      {
        "topic": "com ( ) Don’t Do Cable Overhead Extensions LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7599473749439663361"
      },
      {
        "topic": "Overhead Triceps Extension Complete Guide",
        "url": "https://www.tiktok.com/@deltabolic/video/7627614725223812369"
      },
      {
        "topic": "Most People Set This Up WRONG Most people set the pulley at the lowest position for overhe",
        "url": "https://www.tiktok.com/@deltabolic/video/7627989099143597329"
      }
    ],
    "totalAvailable": 7
  },
  {
    "id": "lib-triceps_kickback",
    "nameHe": "בעיטת טריצפס",
    "nameEn": "Triceps Kickback",
    "muscleGroup": "triceps",
    "videos": [
      {
        "topic": "Keep your elbows high during tricep kickbacks to target the triceps more effectively",
        "url": "https://www.tiktok.com/@deltabolic/video/6843817980191722757"
      },
      {
        "topic": "Make your tricep kickbacks more than effective for bigger triceps using this method",
        "url": "https://www.tiktok.com/@deltabolic/video/6878894621833972994"
      },
      {
        "topic": "Stop moving your upper arm during tricep kickbacks",
        "url": "https://www.tiktok.com/@deltabolic/video/6966953080348806405"
      },
      {
        "topic": "The PERFECT Triceps Kickback",
        "url": "https://www.tiktok.com/@deltabolic/video/7574932670916922641"
      },
      {
        "topic": "You’re Doing Triceps Extensions WRONG!",
        "url": "https://www.tiktok.com/@deltabolic/video/7654371268690709768"
      }
    ],
    "totalAvailable": 5
  },
  {
    "id": "lib-dips",
    "nameHe": "מקבילים",
    "nameEn": "Dips",
    "muscleGroup": "triceps",
    "videos": [
      {
        "topic": "Keep elbows tucked during dips to avoid elbow tendonitis",
        "url": "https://www.tiktok.com/@deltabolic/video/6805603301124541702"
      },
      {
        "topic": "Tip: don’t flare your elbows during tricep dips",
        "url": "https://www.tiktok.com/@deltabolic/video/6809677290339929350"
      },
      {
        "topic": "Stop flaring your elbows during dips to avoid elbow injury",
        "url": "https://www.tiktok.com/@deltabolic/video/6869565245250096389"
      },
      {
        "topic": "Dips work both triceps and lower chest.",
        "url": "https://www.tiktok.com/@deltabolic/video/6965570961865264389"
      },
      {
        "topic": "com Dips – KNOW THE DIFFERENCE!",
        "url": "https://www.tiktok.com/@deltabolic/video/7547129628268219664"
      }
    ],
    "totalAvailable": 5
  },
  {
    "id": "lib-bench_dip",
    "nameHe": "מקבילים על ספסל",
    "nameEn": "Bench Dip",
    "muscleGroup": "triceps",
    "videos": [
      {
        "topic": "STOP Doing Bench Dips LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7208208769124207877"
      },
      {
        "topic": "Bench Dip Form Tips",
        "url": "https://www.tiktok.com/@deltabolic/video/7432090918070619398"
      },
      {
        "topic": "The PERFECT Bench Dip Form!",
        "url": "https://www.tiktok.com/@deltabolic/video/7512952024208526598"
      },
      {
        "topic": "Muscle .com ( ) The PERFECT Bench Dip",
        "url": "https://www.tiktok.com/@deltabolic/video/7567933458475928840"
      }
    ],
    "totalAvailable": 4
  },
  {
    "id": "lib-dumbbell_curl",
    "nameHe": "כפיפת מרפקים בדאמבלים",
    "nameEn": "Dumbbell Curl",
    "muscleGroup": "biceps",
    "videos": [
      {
        "topic": "Stop curling your wrist during bicep curls",
        "url": "https://www.tiktok.com/@deltabolic/video/6794679421136653574"
      },
      {
        "topic": "Stop using momentum during bicep curls",
        "url": "https://www.tiktok.com/@deltabolic/video/6800546602126691590"
      },
      {
        "topic": "Bicep curl tip to maximize bicep gains",
        "url": "https://www.tiktok.com/@deltabolic/video/6830127892840729862"
      },
      {
        "topic": "Stop curling your wrist during bicep curls!",
        "url": "https://www.tiktok.com/@deltabolic/video/6870491326085942530"
      },
      {
        "topic": "Keep your shoulders back / retracted during bicep curls",
        "url": "https://www.tiktok.com/@deltabolic/video/6872195792602451202"
      },
      {
        "topic": "Stop raising your shoulders during dumbbell bicep curls",
        "url": "https://www.tiktok.com/@deltabolic/video/6883615030286290177"
      },
      {
        "topic": "Avoid this common bicep curl mistake",
        "url": "https://www.tiktok.com/@deltabolic/video/6930334757158948101"
      },
      {
        "topic": "Stop raising your shoulders during bicep curls",
        "url": "https://www.tiktok.com/@deltabolic/video/6950476539347684613"
      },
      {
        "topic": "Avoid these bicep curl mistakes if you trying to build bigger biceps",
        "url": "https://www.tiktok.com/@deltabolic/video/6977747412748209414"
      },
      {
        "topic": "Flaring your elbows excessively during bicep curls!",
        "url": "https://www.tiktok.com/@deltabolic/video/7021690774332951813"
      },
      {
        "topic": "Stop keeping your arms bent during bicep curls",
        "url": "https://www.tiktok.com/@deltabolic/video/7022447558031166725"
      },
      {
        "topic": "STOP moving your upper arm excessively during incline bicep curls",
        "url": "https://www.tiktok.com/@deltabolic/video/7110747528437533958"
      },
      {
        "topic": "STOP perform bicep curls with a partial range of motion!",
        "url": "https://www.tiktok.com/@deltabolic/video/7228613063967034630"
      },
      {
        "topic": "STOP flaring out your elbows durjng bicep curls!",
        "url": "https://www.tiktok.com/@deltabolic/video/7245075772501658886"
      },
      {
        "topic": "Here's why doing standing dumbbell curls alternating between arms can offer superior isola",
        "url": "https://www.tiktok.com/@deltabolic/video/7368231680068537606"
      },
      {
        "topic": "Perfect Bicep Curl Form Tips:",
        "url": "https://www.tiktok.com/@deltabolic/video/7400928843915087110"
      },
      {
        "topic": "The PERFECT Barbell Bicep Curl (DO THIS!)",
        "url": "https://www.tiktok.com/@deltabolic/video/7451754414399966470"
      },
      {
        "topic": "Incline Bicep Curl Mistake (DON'T DO THIS!) A common mistake in the incline bicep curl is ",
        "url": "https://www.tiktok.com/@deltabolic/video/7471078615006891269"
      },
      {
        "topic": "The PERFECT Cable Bicep Curl 1 ⃣ Keep your upper arms fixed in a vertical position.",
        "url": "https://www.tiktok.com/@deltabolic/video/7473645877161233719"
      },
      {
        "topic": "FIX THESE Bicep Curl Mistakes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7499243062766472453"
      },
      {
        "topic": "Don't Make THIS Bicep Curl Mistake!",
        "url": "https://www.tiktok.com/@deltabolic/video/7525934008719510790"
      },
      {
        "topic": "official. .com ( ) .com ( ) FIX THIS Bicep Curl Mistake!",
        "url": "https://www.tiktok.com/@deltabolic/video/7560475191244098832"
      },
      {
        "topic": "official. .coml.",
        "url": "https://www.tiktok.com/@deltabolic/video/7562633996245404929"
      },
      {
        "topic": "com ( ) Incline Biceps Curl HACK Place a light barbell behind your back on the incline ben",
        "url": "https://www.tiktok.com/@deltabolic/video/7584931170341735688"
      },
      {
        "topic": "com ( ) Bicep Curl Grips & Muscles Worked Supinated grip (palms up): Maximizes biceps invo",
        "url": "https://www.tiktok.com/@deltabolic/video/7587577174572469521"
      },
      {
        "topic": "You’re (Probably) Doing Incline Bicep Curls Wrong!",
        "url": "https://www.tiktok.com/@deltabolic/video/7615013821366816017"
      },
      {
        "topic": "Bicep Curl Mistakes (FIX THESE!) Mistake : Letting your elbows drift too far forward This ",
        "url": "https://www.tiktok.com/@deltabolic/video/7648401303642590471"
      }
    ],
    "totalAvailable": 27
  },
  {
    "id": "lib-preacher_curl",
    "nameHe": "כפיפת מרפקים בספה",
    "nameEn": "Preacher Curl",
    "muscleGroup": "biceps",
    "videos": [
      {
        "topic": "No access to a preacher curl bicep bench?",
        "url": "https://www.tiktok.com/@deltabolic/video/6880713108009078017"
      },
      {
        "topic": "You can also do this on an incline bench or preacher curl bench if the chair feels uncomfo",
        "url": "https://www.tiktok.com/@deltabolic/video/7076211213910166789"
      },
      {
        "topic": "One way to minimize the risk of a biceps tendon tear when using excessively heavy weights ",
        "url": "https://www.tiktok.com/@deltabolic/video/7370858385438231814"
      },
      {
        "topic": "Preacher Curl Machine Mistakes to Avoid",
        "url": "https://www.tiktok.com/@deltabolic/video/7436891909504634168"
      },
      {
        "topic": "com ( ) DO THIS to Avoid a Biceps Tendon Tear The preacher curl is generally safe when per",
        "url": "https://www.tiktok.com/@deltabolic/video/7558280905333280001"
      },
      {
        "topic": "com ( ) The PERFECT Machine Preacher Curl 1 ⃣ Keep your wrists neutral — this keeps tensio",
        "url": "https://www.tiktok.com/@deltabolic/video/7560124224904416513"
      },
      {
        "topic": "PERFECT Preacher Curl Form 1 ⃣ Keep your wrists neutral — don’t let them bend back 2 ⃣ Kee",
        "url": "https://www.tiktok.com/@deltabolic/video/7607284660267273488"
      }
    ],
    "totalAvailable": 7
  },
  {
    "id": "lib-barbell_curl",
    "nameHe": "כפיפת מרפקים במוט",
    "nameEn": "Barbell Curl",
    "muscleGroup": "biceps",
    "videos": [
      {
        "topic": "Here’s how you can target the inner and outer biceps on the barbell curl.",
        "url": "https://www.tiktok.com/@deltabolic/video/7345993587181505798"
      }
    ],
    "totalAvailable": 1
  },
  {
    "id": "lib-incline_dumbbell_curl",
    "nameHe": "כפיפת מרפקים בשיפוע",
    "nameEn": "Incline Dumbbell Curl",
    "muscleGroup": "biceps",
    "videos": [
      {
        "topic": "How to Perform the PERFECT Incline Dumbbell Curl",
        "url": "https://www.tiktok.com/@deltabolic/video/7618743084087512321"
      }
    ],
    "totalAvailable": 1
  },
  {
    "id": "lib-rear_delt_fly",
    "nameHe": "פרפר הפוך",
    "nameEn": "Rear Delt Fly",
    "muscleGroup": "shoulders",
    "videos": [
      {
        "topic": "Build bigger rear delts FAST",
        "url": "https://www.tiktok.com/@deltabolic/video/6793923749142859014"
      },
      {
        "topic": "Target the front, mid & rear delts to build BIGGER shoulders",
        "url": "https://www.tiktok.com/@deltabolic/video/6797772609455934726"
      },
      {
        "topic": "Stop shrugging and raising your shoulders during rear delt flyes",
        "url": "https://www.tiktok.com/@deltabolic/video/6849942901397458182"
      },
      {
        "topic": "Pull towards your face to focus more on the rear delts",
        "url": "https://www.tiktok.com/@deltabolic/video/6891815522111917314"
      },
      {
        "topic": "STOP shrugging during rear delt flyes!",
        "url": "https://www.tiktok.com/@deltabolic/video/6894406872846060801"
      },
      {
        "topic": "STOP shrugging during rear delt flyes!",
        "url": "https://www.tiktok.com/@deltabolic/video/6894408027110165761"
      },
      {
        "topic": "Point elbows to the side and pull the elbows back to work the rear delts during face pulls",
        "url": "https://www.tiktok.com/@deltabolic/video/6941592592219966726"
      },
      {
        "topic": "Grow your rear delts for 3D shoulders",
        "url": "https://www.tiktok.com/@deltabolic/video/6970066685244083461"
      },
      {
        "topic": "Stop squeezing your shoulder blades together during rear delt flys!",
        "url": "https://www.tiktok.com/@deltabolic/video/7120287229049670917"
      },
      {
        "topic": "DO THIS to increase rear delt activation on reverse flyes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7154454687125654789"
      },
      {
        "topic": "Are you doing cable rows?",
        "url": "https://www.tiktok.com/@deltabolic/video/7258347917864406278"
      },
      {
        "topic": "STOP doing rear delts flyes like this, where your body is completely upright.",
        "url": "https://www.tiktok.com/@deltabolic/video/7339679843618917638"
      },
      {
        "topic": "The conventional standing facepull is excellent for targeting the rear delts, but standing",
        "url": "https://www.tiktok.com/@deltabolic/video/7412795066479119621"
      },
      {
        "topic": "Rear Delt Machine Fly Mistake (DON'T DO THIS!) A common mistake when performing the rear d",
        "url": "https://www.tiktok.com/@deltabolic/video/7452463616655166726"
      },
      {
        "topic": "The PERFECT Rear Delt Fly Form",
        "url": "https://www.tiktok.com/@deltabolic/video/7464276336924790021"
      },
      {
        "topic": ") Mistake : Overhand Grip An overhand grip isn’t necessarily wrong, but an underhand grip ",
        "url": "https://www.tiktok.com/@deltabolic/video/7472556991450238214"
      },
      {
        "topic": "FIX THIS Facepull Mistake!",
        "url": "https://www.tiktok.com/@deltabolic/video/7488128884299336965"
      },
      {
        "topic": "SIZE and SHRED .com The PERFECT Rear Delt Fly",
        "url": "https://www.tiktok.com/@deltabolic/video/7544866892813487378"
      },
      {
        "topic": "com ( ) Cable Rows: Upper Back vs.",
        "url": "https://www.tiktok.com/@deltabolic/video/7560851529704443153"
      },
      {
        "topic": "Seated Row Grip Widths & What They Work Narrow grip (elbows tucked): Emphasizes the lats a",
        "url": "https://www.tiktok.com/@deltabolic/video/7575350536535379216"
      },
      {
        "topic": "com ( ) The PERFECT Cross-Cable Rear Delt Fly",
        "url": "https://www.tiktok.com/@deltabolic/video/7579081152804211984"
      },
      {
        "topic": "com ( ) Fix These Rear Delt Fly Mistakes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7586471889220996369"
      },
      {
        "topic": "com ( ) Do Face Pulls LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7586821501987327248"
      },
      {
        "topic": "com ( ) The PERFECT Rear Delt Machine Fly (DO THIS!) 1 ⃣ Use a pronated grip (palms facing",
        "url": "https://www.tiktok.com/@deltabolic/video/7593889719436496144"
      },
      {
        "topic": "Rear Delt Fly Machine Mistake A common mistake on the rear delt fly (pec deck) is squeezin",
        "url": "https://www.tiktok.com/@deltabolic/video/7600597121871531280"
      },
      {
        "topic": "Rear Delt Dumbbell Fly – Proper Form Guide",
        "url": "https://www.tiktok.com/@deltabolic/video/7610208047830437137"
      },
      {
        "topic": "Don’t Make This Face Pull Mistake!",
        "url": "https://www.tiktok.com/@deltabolic/video/7635443784578387217"
      },
      {
        "topic": "Reverse Machine Fly Mistake If your goal is to isolate your rear delts as much as possible",
        "url": "https://www.tiktok.com/@deltabolic/video/7636159246161169665"
      }
    ],
    "totalAvailable": 28
  },
  {
    "id": "lib-lateral_raise",
    "nameHe": "הרמת ידיים לצדדים",
    "nameEn": "Lateral Raise",
    "muscleGroup": "shoulders",
    "videos": [
      {
        "topic": "Keep your arms slightly bent during side lateral raises to engage your delts more effectiv",
        "url": "https://www.tiktok.com/@deltabolic/video/6837888136002030853"
      },
      {
        "topic": "Stop using momentum to do side lateral raises by bending your knees and moving your body b",
        "url": "https://www.tiktok.com/@deltabolic/video/6841582716270415109"
      },
      {
        "topic": "Keep your arms slightly bent during lateral raises!",
        "url": "https://www.tiktok.com/@deltabolic/video/6881488290814446850"
      },
      {
        "topic": "Common lateral raise mistakes to avoid",
        "url": "https://www.tiktok.com/@deltabolic/video/6887715771577847042"
      },
      {
        "topic": "Full tutorial on side lateral raises and common mistakes on YouTube",
        "url": "https://www.tiktok.com/@deltabolic/video/6931875278767590662"
      },
      {
        "topic": "Keep your arm slightly bent using side lateral raises",
        "url": "https://www.tiktok.com/@deltabolic/video/6950273000218316038"
      },
      {
        "topic": "DO THIS to maximize shoulder engagement during lateral raises",
        "url": "https://www.tiktok.com/@deltabolic/video/7106122744483302661"
      },
      {
        "topic": "STOP elevating your shoulders during lateral raises!",
        "url": "https://www.tiktok.com/@deltabolic/video/7153285645732039941"
      },
      {
        "topic": "STOP elevating your shoulders during lateral raises!",
        "url": "https://www.tiktok.com/@deltabolic/video/7230619955937561862"
      },
      {
        "topic": "STOP DOING LATERAL RAISES LIKE THIS, standing completely straight with your arms fully ext",
        "url": "https://www.tiktok.com/@deltabolic/video/7294419546859916550"
      },
      {
        "topic": "The Perfect Lateral Raise (DO THIS!)",
        "url": "https://www.tiktok.com/@deltabolic/video/7440639070792879415"
      },
      {
        "topic": "STOP DOING THIS on the Lateral Raise!",
        "url": "https://www.tiktok.com/@deltabolic/video/7478502484466552119"
      },
      {
        "topic": "STOP Making This Lateral Raise Mistake!",
        "url": "https://www.tiktok.com/@deltabolic/video/7491475169299500343"
      },
      {
        "topic": "You're Doing Lateral Raises WRONG!",
        "url": "https://www.tiktok.com/@deltabolic/video/7521545911793683768"
      },
      {
        "topic": "The PERFECT Lateral Raise 1 ⃣ Start with the dumbbells held diagonally in front of your th",
        "url": "https://www.tiktok.com/@deltabolic/video/7570556618874604818"
      },
      {
        "topic": "com FIX THIS Lateral Raise Mistake!",
        "url": "https://www.tiktok.com/@deltabolic/video/7572433330445110536"
      },
      {
        "topic": "Stop Making This Lateral Raise Mistake!",
        "url": "https://www.tiktok.com/@deltabolic/video/7594268968643284225"
      },
      {
        "topic": "Stop shrugging your shoulders during lateral raises.",
        "url": "https://www.tiktok.com/@deltabolic/video/7635387543650913537"
      },
      {
        "topic": "FIX THESE Lateral Raise Mistakes Mistake : Keeping your arms locked straight and raising t",
        "url": "https://www.tiktok.com/@deltabolic/video/7639484632693624080"
      }
    ],
    "totalAvailable": 19
  },
  {
    "id": "lib-overhead_press",
    "nameHe": "לחיצת כתפיים מעל הראש",
    "nameEn": "Overhead Press",
    "muscleGroup": "shoulders",
    "videos": [
      {
        "topic": "Stop bending your wrist during overhead presses",
        "url": "https://www.tiktok.com/@deltabolic/video/6795982321926311174"
      },
      {
        "topic": "Stop flaring your elbows at the bottom of the overhead press",
        "url": "https://www.tiktok.com/@deltabolic/video/6796151401304034565"
      },
      {
        "topic": "Do not point your elbows directly to the side during shoulder press",
        "url": "https://www.tiktok.com/@deltabolic/video/6824157029842652422"
      },
      {
        "topic": "Stop flaring your elbows during overhead presses to avoid elbow pain",
        "url": "https://www.tiktok.com/@deltabolic/video/6872732837456481538"
      },
      {
        "topic": "STOP flaring your elbows out during overhead press",
        "url": "https://www.tiktok.com/@deltabolic/video/7086961934993591558"
      },
      {
        "topic": "STOP RAISING your shoulders during shoulder press!",
        "url": "https://www.tiktok.com/@deltabolic/video/7151419422631120134"
      },
      {
        "topic": "STOP Overhead Pressing LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7204509745766468869"
      },
      {
        "topic": "STOP hunching your shoulders during shoulder press!",
        "url": "https://www.tiktok.com/@deltabolic/video/7210548627016633605"
      },
      {
        "topic": "A seated overhead press mistake is lowering the bar down only to eye level.",
        "url": "https://www.tiktok.com/@deltabolic/video/7333408768392219910"
      },
      {
        "topic": "The Perfect Barbell Overhead Press Form Tips:",
        "url": "https://www.tiktok.com/@deltabolic/video/7399428942043614469"
      },
      {
        "topic": "The PERFECT Overhead Dumbbell Triceps Extension 1 ⃣ Adjust Your Seat Position – Slide your",
        "url": "https://www.tiktok.com/@deltabolic/video/7479964650256239877"
      },
      {
        "topic": "Shoulder Press Mistake (DON'T DO THIS!) A common beginner mistake on the shoulder press is",
        "url": "https://www.tiktok.com/@deltabolic/video/7489306372484517126"
      },
      {
        "topic": "com STOP Making These Shoulder Press Mistakes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7516727302072356101"
      },
      {
        "topic": "official. .",
        "url": "https://www.tiktok.com/@deltabolic/video/7563447700646104336"
      },
      {
        "topic": "FIX This Shoulder Press Mistake!",
        "url": "https://www.tiktok.com/@deltabolic/video/7588654080642272528"
      },
      {
        "topic": "com ( ) .",
        "url": "https://www.tiktok.com/@deltabolic/video/7592812388273982721"
      },
      {
        "topic": "com ( ) Fix THESE Shoulder Press Mistakes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7609889252444343553"
      }
    ],
    "totalAvailable": 17
  },
  {
    "id": "lib-shrug",
    "nameHe": "הרמת כתפיים",
    "nameEn": "Shrug",
    "muscleGroup": "shoulders",
    "videos": [
      {
        "topic": "Stop shrugging your shoulders during side laterals",
        "url": "https://www.tiktok.com/@deltabolic/video/6836906581473398022"
      },
      {
        "topic": "Stop shrugging your shoulders during barbell curls",
        "url": "https://www.tiktok.com/@deltabolic/video/6840687402898541829"
      },
      {
        "topic": "Stop shrugging your shoulders during back rows!",
        "url": "https://www.tiktok.com/@deltabolic/video/6850884602895158533"
      },
      {
        "topic": "STOP shrugging your shoulders during back rows",
        "url": "https://www.tiktok.com/@deltabolic/video/6956029285228449030"
      },
      {
        "topic": "Do shrugs LIKE THIS for greater traps activation!",
        "url": "https://www.tiktok.com/@deltabolic/video/7081062105419435270"
      },
      {
        "topic": "STOP SHRUGGING your shoulders during dips!",
        "url": "https://www.tiktok.com/@deltabolic/video/7114406189726780678"
      },
      {
        "topic": "Summer Sale is now LIVE!",
        "url": "https://www.tiktok.com/@deltabolic/video/7533055215797357829"
      },
      {
        "topic": "3 Bicep Curl Mistakes You Need to Fix Mistake : Shrugging your shoulders as you curl — thi",
        "url": "https://www.tiktok.com/@deltabolic/video/7536720767279516933"
      },
      {
        "topic": "com ( ) STOP Making This Bicep Curl Mistake!",
        "url": "https://www.tiktok.com/@deltabolic/video/7584196042317466881"
      },
      {
        "topic": "Fix Your Bicep Curl Mistakes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7600601665439370497"
      }
    ],
    "totalAvailable": 10
  },
  {
    "id": "lib-cable_lateral_raise",
    "nameHe": "הרמה לצדדים בכבל",
    "nameEn": "Cable Lateral Raise",
    "muscleGroup": "shoulders",
    "videos": [
      {
        "topic": "STOP Making This Cable Lateral Raise Mistake!",
        "url": "https://www.tiktok.com/@deltabolic/video/7486685939025054981"
      },
      {
        "topic": "com ( ) Good vs Better Cable Lateral Raises Good: Pulley at the lowest setting Better: Pul",
        "url": "https://www.tiktok.com/@deltabolic/video/7551983049441824017"
      },
      {
        "topic": "official - . Cable Lateral Raise Complete Guide",
        "url": "https://www.tiktok.com/@deltabolic/video/7625375149541379329"
      },
      {
        "topic": "Cable Lateral Raise HACK What's the benefit of using the strap?",
        "url": "https://www.tiktok.com/@deltabolic/video/7659543046844910849"
      }
    ],
    "totalAvailable": 4
  },
  {
    "id": "lib-dumbbell_shoulder_press",
    "nameHe": "לחיצת כתפיים בדאמבלים",
    "nameEn": "Dumbbell Shoulder Press",
    "muscleGroup": "shoulders",
    "videos": [
      {
        "topic": "Stop crashing the dumbbells together and locking your elbows out at the top during dumbbel",
        "url": "https://www.tiktok.com/@deltabolic/video/6951250537874525446"
      },
      {
        "topic": "DO THIS on the shoulder press for WIDER shoulders!",
        "url": "https://www.tiktok.com/@deltabolic/video/7281018176089967877"
      },
      {
        "topic": "The Perfect Dumbbell Shoulder Press: Key Tips 1 ⃣ Adjust the Bench Angle: Set the bench to",
        "url": "https://www.tiktok.com/@deltabolic/video/7460671234355891462"
      },
      {
        "topic": "Stop Doing THIS on the Shoulder Press!",
        "url": "https://www.tiktok.com/@deltabolic/video/7569074148228566280"
      }
    ],
    "totalAvailable": 4
  },
  {
    "id": "lib-machine_shoulder_press",
    "nameHe": "לחיצת כתפיים במכונה",
    "nameEn": "Machine Shoulder Press",
    "muscleGroup": "shoulders",
    "videos": [
      {
        "topic": "The PERFECT Smith Machine Shoulder Press 1 ⃣ Grip Width: Use a grip slightly wider than sh",
        "url": "https://www.tiktok.com/@deltabolic/video/7534524291493252357"
      },
      {
        "topic": "com ( ) Machine Shoulder Press Grip & Position Guide • Neutral grip places more emphasis o",
        "url": "https://www.tiktok.com/@deltabolic/video/7584974500165422352"
      },
      {
        "topic": "Shoulder Press Machine Mistake (DON'T DO THIS!) Stop pressing with your elbows pointed bac",
        "url": "https://www.tiktok.com/@deltabolic/video/7637645458428464385"
      },
      {
        "topic": "How to Perform the Machine Shoulder Press",
        "url": "https://www.tiktok.com/@deltabolic/video/7663674671677705488"
      }
    ],
    "totalAvailable": 4
  },
  {
    "id": "lib-upright_row",
    "nameHe": "חתירה זקופה",
    "nameEn": "Upright Row",
    "muscleGroup": "shoulders",
    "videos": [
      {
        "topic": "Your elbows shouldn’t pass shoulder height during upright rows if you want to avoid should",
        "url": "https://www.tiktok.com/@deltabolic/video/6852173453030673669"
      },
      {
        "topic": "Stop using a narrow grip for upright rows.",
        "url": "https://www.tiktok.com/@deltabolic/video/7095896928361270533"
      }
    ],
    "totalAvailable": 2
  },
  {
    "id": "lib-face_pull",
    "nameHe": "משיכת פנים",
    "nameEn": "Face Pull",
    "muscleGroup": "shoulders",
    "videos": [
      {
        "topic": "Try this face pull alternative using dumbbells only",
        "url": "https://www.tiktok.com/@deltabolic/video/6881099289733401857"
      },
      {
        "topic": "com ( ) .",
        "url": "https://www.tiktok.com/@deltabolic/video/7586069572965387536"
      }
    ],
    "totalAvailable": 2
  },
  {
    "id": "lib-front_raise",
    "nameHe": "הרמת ידיים לפנים",
    "nameEn": "Front Raise",
    "muscleGroup": "shoulders",
    "videos": [
      {
        "topic": "official. .",
        "url": "https://www.tiktok.com/@deltabolic/video/7602402297020239121"
      }
    ],
    "totalAvailable": 1
  },
  {
    "id": "lib-arnold_press",
    "nameHe": "לחיצת ארנולד",
    "nameEn": "Arnold Press",
    "muscleGroup": "shoulders",
    "videos": [
      {
        "topic": "The PERFECT Arnold Press",
        "url": "https://www.tiktok.com/@deltabolic/video/7666256822126316817"
      }
    ],
    "totalAvailable": 1
  },
  {
    "id": "lib-barbell_squat",
    "nameHe": "סקוואט במוט",
    "nameEn": "Barbell Squat",
    "muscleGroup": "legs",
    "videos": [
      {
        "topic": "MAXIMIZE leg gains and avoid knee injury with proper squat form",
        "url": "https://www.tiktok.com/@deltabolic/video/6786332727881813254"
      },
      {
        "topic": "Stop curling your upper back during split squats",
        "url": "https://www.tiktok.com/@deltabolic/video/6800044262005280006"
      },
      {
        "topic": "Just bought a new squat stand.",
        "url": "https://www.tiktok.com/@deltabolic/video/6824703088532704518"
      },
      {
        "topic": "Stop curling your back when doing squats",
        "url": "https://www.tiktok.com/@deltabolic/video/6827962063311211782"
      },
      {
        "topic": "Your knees shouldn’t pass your toes excessively during squats if you want to maintain good",
        "url": "https://www.tiktok.com/@deltabolic/video/6847721920817925381"
      },
      {
        "topic": "I use to rarely do squats when I started.",
        "url": "https://www.tiktok.com/@deltabolic/video/6898932661545438465"
      },
      {
        "topic": "Stop squatting like this‼",
        "url": "https://www.tiktok.com/@deltabolic/video/6907374027707305222"
      },
      {
        "topic": "The best squat tip ever",
        "url": "https://www.tiktok.com/@deltabolic/video/6958970514698177797"
      },
      {
        "topic": "Determine your optimal squat stance for a STRONGER SQUAT",
        "url": "https://www.tiktok.com/@deltabolic/video/6984072009990868230"
      },
      {
        "topic": "Increase your ankle mobility to improve your squat form for greater leg gains",
        "url": "https://www.tiktok.com/@deltabolic/video/7065722003872812294"
      },
      {
        "topic": "Stop raising your hips too fast relative to your chest during squats",
        "url": "https://www.tiktok.com/@deltabolic/video/7074616382268214534"
      },
      {
        "topic": "DO THIS to increase your squat",
        "url": "https://www.tiktok.com/@deltabolic/video/7082410438834523398"
      },
      {
        "topic": "DO THIS for a STRONGER SQUAT",
        "url": "https://www.tiktok.com/@deltabolic/video/7112471102894378245"
      },
      {
        "topic": "Stop the butt wink during squats",
        "url": "https://www.tiktok.com/@deltabolic/video/7135905456693775621"
      },
      {
        "topic": "STOP squatting with a diagonal/curved bar path!",
        "url": "https://www.tiktok.com/@deltabolic/video/7236916368405269766"
      },
      {
        "topic": "Squat: Elevated Heels vs Toes (KNOW THE DIFFERENCE!) The goblet/barbell squat targets your",
        "url": "https://www.tiktok.com/@deltabolic/video/7436192127601741112"
      },
      {
        "topic": "FIX THESE Squat Mistakes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7460339962857164038"
      },
      {
        "topic": "Fix This Squat Mistake!",
        "url": "https://www.tiktok.com/@deltabolic/video/7524127483097124101"
      },
      {
        "topic": "Squat Mistake You NEED to Fix!",
        "url": "https://www.tiktok.com/@deltabolic/video/7525988064829705478"
      },
      {
        "topic": "FIX THIS SQUAT MISTAKE!",
        "url": "https://www.tiktok.com/@deltabolic/video/7533775668153257272"
      },
      {
        "topic": "The best solution to knee pain while squatting!",
        "url": "https://www.tiktok.com/@deltabolic/video/7543733315371650309"
      },
      {
        "topic": "com ( ) The PERFECT Barbell Squat 1 ⃣ Keep your knees in line with your toes — don’t let t",
        "url": "https://www.tiktok.com/@deltabolic/video/7564125626001575169"
      },
      {
        "topic": "The PERFECT Dumbbell Sumo Squat",
        "url": "https://www.tiktok.com/@deltabolic/video/7652514843739589904"
      },
      {
        "topic": "official - . The PERFECT Barbell Squat (Step-by-Step Guide)",
        "url": "https://www.tiktok.com/@deltabolic/video/7659132922225577233"
      }
    ],
    "totalAvailable": 24
  },
  {
    "id": "lib-leg_press",
    "nameHe": "לחיצת רגליים",
    "nameEn": "Leg Press",
    "muscleGroup": "legs",
    "videos": [
      {
        "topic": "Build bigger calves using any leg press machine",
        "url": "https://www.tiktok.com/@deltabolic/video/6788742907751845125"
      },
      {
        "topic": "Simple trick to targeting hamstrings and glutes on leg press",
        "url": "https://www.tiktok.com/@deltabolic/video/6879587043060518145"
      },
      {
        "topic": "Stop leg pressing like THIS",
        "url": "https://www.tiktok.com/@deltabolic/video/7006312614796004613"
      },
      {
        "topic": "DO THIS to maximize leg gains on the leg press",
        "url": "https://www.tiktok.com/@deltabolic/video/7102442371928886533"
      },
      {
        "topic": "Avoid locking out your knees abruptly on the leg press, especially with heavy weights, sin",
        "url": "https://www.tiktok.com/@deltabolic/video/7369429261419089158"
      },
      {
        "topic": "The PERFECT Leg Press",
        "url": "https://www.tiktok.com/@deltabolic/video/7473171662842645815"
      },
      {
        "topic": "Stop Making These Leg Press Mistakes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7510010988339547398"
      },
      {
        "topic": "com ( ) .",
        "url": "https://www.tiktok.com/@deltabolic/video/7590967747601894657"
      },
      {
        "topic": "How to Do the PERFECT Leg Press 1 ⃣ Set the seat back as far as it goes This increases you",
        "url": "https://www.tiktok.com/@deltabolic/video/7602072773535501584"
      },
      {
        "topic": "official - . Leg Press Mistakes You NEED to Fix Mistake : Lower back rounding & butt lifti",
        "url": "https://www.tiktok.com/@deltabolic/video/7642092035922464017"
      },
      {
        "topic": "You’re Doing the Leg Press WRONG!",
        "url": "https://www.tiktok.com/@deltabolic/video/7651794944499240193"
      }
    ],
    "totalAvailable": 11
  },
  {
    "id": "lib-leg_curl",
    "nameHe": "כפיפת ברכיים",
    "nameEn": "Leg Curl",
    "muscleGroup": "legs",
    "videos": [
      {
        "topic": "Point your toes away during leg curls to engage more of the hamstrings",
        "url": "https://www.tiktok.com/@deltabolic/video/6930086741219020037"
      },
      {
        "topic": "Practice relaxing your calves while you point your toes away during any leg curl machine",
        "url": "https://www.tiktok.com/@deltabolic/video/6935835356663254278"
      },
      {
        "topic": "If you point your toes inward on the leg curl, you'll target the semitendinosus and semime",
        "url": "https://www.tiktok.com/@deltabolic/video/7428399053379095814"
      },
      {
        "topic": "Leg Curl Form Tips (DO THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7440248747478617399"
      },
      {
        "topic": "com ( ) Hip Thrust Foot Placement & Muscles Worked",
        "url": "https://www.tiktok.com/@deltabolic/video/7574984731347914000"
      },
      {
        "topic": "com ( ) The PERFECT Leg Curl - Set the pad just above your ankles and below your calves fo",
        "url": "https://www.tiktok.com/@deltabolic/video/7577965531286834433"
      },
      {
        "topic": "The PERFECT Seated Leg Curl Tips 1 ⃣ Set the lower pad properly – Position it between your",
        "url": "https://www.tiktok.com/@deltabolic/video/7612834854970952977"
      }
    ],
    "totalAvailable": 7
  },
  {
    "id": "lib-leg_extension",
    "nameHe": "פשיטת ברכיים",
    "nameEn": "Leg Extension",
    "muscleGroup": "legs",
    "videos": [
      {
        "topic": "Leg Extension Form Tips",
        "url": "https://www.tiktok.com/@deltabolic/video/7429115752721992966"
      },
      {
        "topic": "Use The Leg Extension to Work Your QUADS, HAMSTRINGS & GLUTES!",
        "url": "https://www.tiktok.com/@deltabolic/video/7439489360115830072"
      },
      {
        "topic": "official. .com ( ) The PERFECT Leg Extension 1 ⃣ Align the machine’s pivot point with your",
        "url": "https://www.tiktok.com/@deltabolic/video/7561533232873803024"
      },
      {
        "topic": "Leg Extension Form Guide 1 ⃣ Position the back of your knee crease right against the edge ",
        "url": "https://www.tiktok.com/@deltabolic/video/7608379006219455745"
      },
      {
        "topic": "Leg Extension Isn’t Just for Quads!",
        "url": "https://www.tiktok.com/@deltabolic/video/7616831314641128720"
      },
      {
        "topic": "Leg Extension & Curl (Beginner vs Advanced) Most beginners — and even many intermediates —",
        "url": "https://www.tiktok.com/@deltabolic/video/7621318563554446608"
      },
      {
        "topic": "Do Leg Extensions LIKE THIS!",
        "url": "https://www.tiktok.com/@deltabolic/video/7638006759000427792"
      }
    ],
    "totalAvailable": 7
  },
  {
    "id": "lib-lunge",
    "nameHe": "מכרעים",
    "nameEn": "Lunge",
    "muscleGroup": "legs",
    "videos": [
      {
        "topic": "Stop caving in your knees during lunges",
        "url": "https://www.tiktok.com/@deltabolic/video/6799760560926805253"
      },
      {
        "topic": "Never run out of space doing walking lunges",
        "url": "https://www.tiktok.com/@deltabolic/video/6810188900091383046"
      },
      {
        "topic": "If you want a nicer butt, you got to build the gluteus maximus and the gluteus medius.",
        "url": "https://www.tiktok.com/@deltabolic/video/7359756458457632006"
      },
      {
        "topic": "com. The PERFECT Dumbbell Static Lunge Avoid common mistakes and maximize your gains with ",
        "url": "https://www.tiktok.com/@deltabolic/video/7511121450422504710"
      },
      {
        "topic": "Fix These Dumbbell Lunge Mistakes!",
        "url": "https://www.tiktok.com/@deltabolic/video/7525570105577704710"
      },
      {
        "topic": "How to Do the PERFECT Static Lunge",
        "url": "https://www.tiktok.com/@deltabolic/video/7654004806108843265"
      }
    ],
    "totalAvailable": 6
  },
  {
    "id": "lib-smith_machine_squat",
    "nameHe": "סקוואט בסמית'",
    "nameEn": "Smith Machine Squat",
    "muscleGroup": "legs",
    "videos": [
      {
        "topic": "If you place your feet further in front on the smith machine squat, you'll bias the glutes",
        "url": "https://www.tiktok.com/@deltabolic/video/7419104878112410885"
      },
      {
        "topic": "Wearing the latest from — .",
        "url": "https://www.tiktok.com/@deltabolic/video/7513352117692665094"
      },
      {
        "topic": "Smith Machine Squat Variation – Targeting Quads vs Glutes The Smith machine squat activate",
        "url": "https://www.tiktok.com/@deltabolic/video/7516331736083598597"
      },
      {
        "topic": "com ( ) Foot Placement & Muscle Emphasis Leg Press • High Foot Placement Emphasizes glutes",
        "url": "https://www.tiktok.com/@deltabolic/video/7565265280272796945"
      },
      {
        "topic": "How to Perform the Smith Machine Squat",
        "url": "https://www.tiktok.com/@deltabolic/video/7620156173517425937"
      }
    ],
    "totalAvailable": 5
  },
  {
    "id": "lib-hip_thrust",
    "nameHe": "הרמת אגן",
    "nameEn": "Hip Thrust",
    "muscleGroup": "legs",
    "videos": [
      {
        "topic": "FIX THIS Hip Thrust Mistake!",
        "url": "https://www.tiktok.com/@deltabolic/video/7490726393131699462"
      },
      {
        "topic": "Hip Thrust Foot Placement & Muscles Worked No matter where you place your feet, the hip th",
        "url": "https://www.tiktok.com/@deltabolic/video/7643944699027328273"
      },
      {
        "topic": "official - . The PERFECT Machine Hip Thrust",
        "url": "https://www.tiktok.com/@deltabolic/video/7670695056315092244"
      }
    ],
    "totalAvailable": 3
  },
  {
    "id": "lib-bulgarian_split_squat",
    "nameHe": "סקוואט בולגרי",
    "nameEn": "Bulgarian Split Squat",
    "muscleGroup": "legs",
    "videos": [
      {
        "topic": "Bulgarian Split Squat Setup & Form Tips (DO THIS!)",
        "url": "https://www.tiktok.com/@deltabolic/video/7447369573457857798"
      },
      {
        "topic": "The PERFECT Bulgarian Split Squat Setup",
        "url": "https://www.tiktok.com/@deltabolic/video/7648069498406227217"
      },
      {
        "topic": "Bulgarian Split Squat: Quads vs.",
        "url": "https://www.tiktok.com/@deltabolic/video/7662907611964099856"
      }
    ],
    "totalAvailable": 3
  },
  {
    "id": "lib-goblet_squat",
    "nameHe": "גובלט סקוואט",
    "nameEn": "Goblet Squat",
    "muscleGroup": "legs",
    "videos": [
      {
        "topic": "com Dumbbell Squat — KNOW THE DIFFERENCE!",
        "url": "https://www.tiktok.com/@deltabolic/video/7549350401796050177"
      }
    ],
    "totalAvailable": 1
  },
  {
    "id": "lib-hip_abduction",
    "nameHe": "הרחקת ירך",
    "nameEn": "Hip Abduction",
    "muscleGroup": "legs",
    "videos": [
      {
        "topic": "Hip Abduction Machine: KNOW THE DIFFERENCE!",
        "url": "https://www.tiktok.com/@deltabolic/video/7493305002232909061"
      }
    ],
    "totalAvailable": 1
  },
  {
    "id": "lib-front_squat",
    "nameHe": "פרונט סקוואט",
    "nameEn": "Front Squat",
    "muscleGroup": "legs",
    "videos": [
      {
        "topic": "com The PERFECT Front Squat",
        "url": "https://www.tiktok.com/@deltabolic/video/7540797050795986181"
      }
    ],
    "totalAvailable": 1
  }
]

/** סך כל המשקל של סרטוני המאגר, בבתים */
export const LIBRARY_TOTAL_BYTES = 192023654

/** מספר סרטוני המאגר שנכנסו לבנייה */
export const LIBRARY_COUNT = 487

/** התקרה שהופעלה בייבוא, או null כשהכל נכנס */
export const LIBRARY_MAX_PER_EXERCISE: number | null = null

/** כמה סרטונים קיימים במקור ולא נכנסו לבנייה */
export const LIBRARY_OMITTED = 0

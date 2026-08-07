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
  /** כמה סרטונים קיימים במקור, לפני התקרה של 3 */
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
export const LIBRARY_TOTAL_BYTES = 56705287

/** מספר סרטוני המאגר שנכנסו לבנייה */
export const LIBRARY_COUNT = 155

/** התקרה שהופעלה בייבוא — כמה סרטונים לכל תרגיל */
export const LIBRARY_MAX_PER_EXERCISE = 3

/** כמה סרטונים קיימים במקור ולא נכנסו לבנייה */
export const LIBRARY_OMITTED = 332

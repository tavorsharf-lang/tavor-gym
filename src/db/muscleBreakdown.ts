// תמלול של מה שכתוב על כרטיסי השרירים — לא מחקר ולא הערכה שלנו.
//
// כל שורה כאן הועתקה מהכרטיס עצמו: השם העברי, השם האנגלי והאחוז, כפי שהם
// מודפסים על התמונה. שום מספר לא חושב, לא הושלם ולא הוסק. כרטיס שאין עליו
// אחוזים כלל פשוט לא מופיע כאן — ראו IMAGES_WITHOUT_PERCENTAGES.
//
// מקור: 89 הכרטיסים ב-public/images/ex.

/** שריר יחיד כפי שהוא מסומן על הכרטיס */
export interface MuscleShare {
  he: string
  en: string
  /** האחוז המודפס על הכרטיס */
  pct: number
}

/** מפתח = מזהה התמונה ב-IMAGE_MANIFEST */
export const MUSCLE_BREAKDOWN: Readonly<Record<string, readonly MuscleShare[]>> = {
  '45_plate_loaded_leg_press': [
    { he: 'ונדוס לטרליס', en: 'Vastus Lateralis', pct: 50 },
    { he: 'רקטוס פמוריס', en: 'Rectus Femoris', pct: 30 },
    { he: 'ונדוס מדיאליס', en: 'Vastus Medialis', pct: 15 },
    { he: 'גלוטאוס מקסימוס', en: 'Gluteus Maximus', pct: 5 },
  ],
  '45_plate_loaded_leg_press_2': [
    { he: 'ארבע ראשי', en: 'Quadriceps', pct: 65 },
    { he: 'ישבן גדול', en: 'Gluteus Maximus', pct: 15 },
    { he: 'המסטרינגס', en: 'Hamstrings', pct: 10 },
    { he: 'סולאוס', en: 'Soleus', pct: 10 },
  ],
  'arnold_press': [
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 45 },
    { he: 'כתף אמצעית', en: 'Lateral Deltoid', pct: 30 },
    { he: 'תלת-ראשי זרועי', en: 'Triceps Brachii', pct: 25 },
  ],
  'back_extension': [
    { he: 'עכוז גדול', en: 'Gluteus Maximus', pct: 35 },
    { he: 'המסטרינגס', en: 'Hamstrings', pct: 30 },
    { he: 'זוקפי הגב', en: 'Erector Spinae', pct: 25 },
    { he: 'מקרב גדול', en: 'Adductor Magnus', pct: 10 },
  ],
  'barbell_back_squat': [
    { he: 'ארבע-ראשי', en: 'Quadriceps', pct: 45 },
    { he: 'עכוז גדול', en: 'Gluteus Maximus', pct: 30 },
    { he: 'מקרב גדול', en: 'Adductor Magnus', pct: 15 },
    { he: 'זוקפי הגב', en: 'Erector Spinae', pct: 10 },
  ],
  'barbell_front_squat': [
    { he: 'ארבע-ראשי', en: 'Quadriceps', pct: 50 },
    { he: 'עכוז גדול', en: 'Gluteus Maximus', pct: 25 },
    { he: 'מקרב גדול', en: 'Adductor Magnus', pct: 15 },
    { he: 'זוקפי הגב', en: 'Erector Spinae', pct: 10 },
  ],
  'barbell_hip_thrust': [
    { he: 'עכוז גדול', en: 'Gluteus Maximus', pct: 60 },
    { he: 'מקרב גדול', en: 'Adductor Magnus', pct: 15 },
    { he: 'המסטרינגס', en: 'Hamstrings', pct: 15 },
    { he: 'ארבע-ראשי', en: 'Quadriceps', pct: 10 },
  ],
  'behind_the_body_cable_curl': [
    { he: 'ברכיאליס', en: 'Brachialis', pct: 35 },
    { he: 'ברכיורדיאליס', en: 'Brachioradialis', pct: 35 },
    { he: 'בייספס', en: 'Biceps Brachii', pct: 30 },
  ],
  'behind_the_body_cable_curl_2': [
    { he: 'דו-ראשי של הזרוע', en: 'Biceps Brachii', pct: 75 },
    { he: 'ברכיאליס', en: 'Brachialis', pct: 15 },
    { he: 'זרועי', en: 'Brachioradialis', pct: 10 },
  ],
  'bench_dip': [
    { he: 'תלת-ראשי', en: 'Triceps Brachii', pct: 65 },
    { he: 'חזה גדול', en: 'Pectoralis Major', pct: 20 },
    { he: 'דלתא קדמית', en: 'Anterior Deltoid', pct: 15 },
  ],
  'bent_over_barbell_row': [
    { he: 'רחב גבי', en: 'Latissimus Dorsi', pct: 30 },
    { he: 'טרפז אמצעי', en: 'Middle Trapezius', pct: 20 },
    { he: 'מעוינים', en: 'Rhomboids', pct: 15 },
    { he: 'זוקפי הגב', en: 'Erector Spinae', pct: 15 },
    { he: 'כתף אחורית', en: 'Posterior Deltoid', pct: 10 },
    { he: 'דו-ראשי זרועי', en: 'Biceps Brachii', pct: 10 },
  ],
  'bent_over_dumbbell_rear_delt_fly': [
    { he: 'כתף אחורית', en: 'Posterior Deltoid', pct: 60 },
    { he: 'טרפז אמצעי', en: 'Middle Trapezius', pct: 15 },
    { he: 'מעוינים', en: 'Rhomboids', pct: 10 },
    { he: 'תת-קוצי', en: 'Infraspinatus', pct: 10 },
    { he: 'עגול קטן', en: 'Teres Minor', pct: 5 },
  ],
  'bulgarian_split_squat': [
    { he: 'ארבע-ראשי', en: 'Quadriceps', pct: 40 },
    { he: 'עכוז גדול', en: 'Gluteus Maximus', pct: 35 },
    { he: 'מקרב גדול', en: 'Adductor Magnus', pct: 15 },
    { he: 'המסטרינגס', en: 'Hamstrings', pct: 10 },
  ],
  'cable_chest_fly': [
    { he: 'חזה אמצעי-תחתון', en: 'Sternocostal Pectoralis', pct: 45 },
    { he: 'חזה עליון', en: 'Clavicular Pectoralis', pct: 25 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 20 },
    { he: 'המסור הקדמי', en: 'Serratus Anterior', pct: 10 },
  ],
  'cable_face_pull': [
    { he: 'כתף אחורית', en: 'Posterior Deltoid', pct: 35 },
    { he: 'טרפז אמצעי', en: 'Middle Trapezius', pct: 20 },
    { he: 'מעוינים', en: 'Rhomboids', pct: 20 },
    { he: 'תת-קוצי', en: 'Infraspinatus', pct: 15 },
    { he: 'עגול קטן', en: 'Teres Minor', pct: 10 },
  ],
  'cable_lateral_raise': [
    { he: 'כתף אמצעית', en: 'Lateral Deltoid', pct: 60 },
    { he: 'מסובב על-קוצי', en: 'Supraspinatus', pct: 15 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 15 },
    { he: 'כתף אחורית', en: 'Posterior Deltoid', pct: 10 },
  ],
  'cable_triceps_pushdown': [
    { he: 'ראש צידי של הטרייספס', en: 'Triceps Lateral Head', pct: 40 },
    { he: 'ראש ארוך של הטרייספס', en: 'Triceps Long Head', pct: 35 },
    { he: 'ראש תיכוני של הטרייספס', en: 'Triceps Medial Head', pct: 25 },
  ],
  'cable_wrist_curl': [
    { he: 'מכופף שורש כף היד הרדיאלי', en: 'Flexor Carpi Radialis', pct: 35 },
    { he: 'כופפי האצבעות שטחיים', en: 'Flexor Digitorum Superficialis', pct: 35 },
    { he: 'מכופף שורש כף היד האולנרי', en: 'Flexor Carpi Ulnaris', pct: 30 },
  ],
  'calf_press_on_leg_press': [
    { he: 'תאומים', en: 'Gastrocnemius', pct: 70 },
    { he: 'סוליה', en: 'Soleus', pct: 30 },
  ],
  'conventional_barbell_deadlift': [
    { he: 'עכוז גדול', en: 'Gluteus Maximus', pct: 30 },
    { he: 'זוקפי הגב', en: 'Erector Spinae', pct: 25 },
    { he: 'המסטרינגס', en: 'Hamstrings', pct: 20 },
    { he: 'ארבע-ראשי', en: 'Quadriceps', pct: 15 },
    { he: 'רחב גבי', en: 'Latissimus Dorsi', pct: 10 },
  ],
  'decline_machine_pec_fly': [
    { he: 'חזה תחתון', en: 'Lower Pectoralis', pct: 50 },
    { he: 'חזה אמצעי', en: 'Middle Sternocostal', pct: 30 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 20 },
  ],
  'dumbbell_front_raise': [
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 65 },
    { he: 'חזה עליון', en: 'Clavicular Pectoralis Major', pct: 15 },
    { he: 'כתף אמצעית', en: 'Lateral Deltoid', pct: 10 },
    { he: 'מסור קדמי', en: 'Serratus Anterior', pct: 10 },
  ],
  'dumbbell_pullover': [
    { he: 'חזה גדול', en: 'Pectoralis Major', pct: 45 },
    { he: 'רחב גבי', en: 'Latissimus Dorsi', pct: 30 },
    { he: 'ראש ארוך של הטרייספס', en: 'Triceps Long Head', pct: 15 },
    { he: 'כתף אחורית', en: 'Posterior Deltoid', pct: 10 },
  ],
  'dumbbell_shoulder_press': [
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 45 },
    { he: 'כתף אמצעית', en: 'Lateral Deltoid', pct: 30 },
    { he: 'תלת-ראשי זרועי', en: 'Triceps Brachii', pct: 25 },
  ],
  'dumbbell_shrug': [
    { he: 'טרפז עליון', en: 'Upper Trapezius', pct: 65 },
    { he: 'מרים השכמה', en: 'Levator Scapulae', pct: 20 },
    { he: 'טרפז אמצעי', en: 'Middle Trapezius', pct: 15 },
  ],
  'dumbbell_sumo_squat': [
    { he: 'מקרב גדול', en: 'Adductor Magnus', pct: 35 },
    { he: 'עכוז גדול', en: 'Gluteus Maximus', pct: 30 },
    { he: 'ארבע-ראשי', en: 'Quadriceps', pct: 25 },
    { he: 'המסטרינגס', en: 'Hamstrings', pct: 10 },
  ],
  'dumbbell_triceps_kickback': [
    { he: 'ראש צידי של הטרייספס', en: 'Triceps Lateral Head', pct: 45 },
    { he: 'ראש ארוך של הטרייספס', en: 'Triceps Long Head', pct: 30 },
    { he: 'ראש תיכוני של הטרייספס', en: 'Triceps Medial Head', pct: 25 },
  ],
  'dumbbell_wrist_curl': [
    { he: 'מרחיב שורש כף היד הרדיאלי', en: 'Extensor Carpi Radialis', pct: 50 },
    { he: 'מרחיב שורש כף היד האולנרי', en: 'Extensor Carpi Ulnaris', pct: 50 },
    { he: 'מכופף שורש כף היד הרדיאלי', en: 'Flexor Carpi Radialis', pct: 35 },
    { he: 'מכופף שורש כף היד האולנרי', en: 'Flexor Carpi Ulnaris', pct: 35 },
    { he: 'כופף שורש כף היד הגומדי', en: 'Palmaris Longus', pct: 30 },
  ],
  'flat_barbell_bench_press': [
    { he: 'החזה הגדול', en: 'Pectoralis Major', pct: 65 },
    { he: 'דו-ראשי של הזרוע', en: 'Biceps Brachii', pct: 15 },
    { he: 'הכתף הקדמית', en: 'Anterior Deltoid', pct: 10 },
    { he: 'תלת-ראשי של הזרוע', en: 'Triceps Brachii', pct: 7 },
    { he: 'שרירי מייצבים', en: 'Stabilizers', pct: 3 },
  ],
  'flat_barbell_bench_press_2': [
    { he: 'חזה אמצעי-תחתון', en: 'Sternocostal Pectoralis', pct: 40 },
    { he: 'טרייספס', en: 'Triceps Brachii', pct: 25 },
    { he: 'חזה עליון', en: 'Clavicular Pectoralis', pct: 20 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 15 },
  ],
  'flat_dumbbell_bench_press': [
    { he: 'חזה אמצעי-תחתון', en: 'Sternocostal Pectoralis', pct: 45 },
    { he: 'חזה עליון', en: 'Clavicular Pectoralis', pct: 20 },
    { he: 'טרייספס', en: 'Triceps Brachii', pct: 20 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 15 },
  ],
  'flat_dumbbell_chest_fly': [
    { he: 'חזה אמצעי-תחתון', en: 'Sternocostal Pectoralis', pct: 55 },
    { he: 'חזה עליון', en: 'Clavicular Pectoralis', pct: 30 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 15 },
  ],
  'floor_crunch': [
    { he: 'ישר בטני', en: 'Rectus Abdominis', pct: 70 },
    { he: 'אלכסוני חיצוני', en: 'External Oblique', pct: 15 },
    { he: 'אלכסוני פנימי', en: 'Internal Oblique', pct: 10 },
    { he: 'רחב בטני', en: 'Transversus Abdominis', pct: 5 },
  ],
  'forearm_plank': [
    { he: 'הישר הבטני', en: 'Rectus Abdominis', pct: 35 },
    { he: 'שרירי בטן אלכסוניים', en: 'Obliques', pct: 25 },
    { he: 'ישבן גדול', en: 'Gluteus Maximus', pct: 25 },
    { he: 'שרירי בטן עמוקים', en: 'Deep Core', pct: 15 },
  ],
  'forward_leaning_dumbbell_shrug': [
    { he: 'טרפז עליון', en: 'Upper Trapezius', pct: 50 },
    { he: 'טרפז אמצעי', en: 'Middle Trapezius', pct: 25 },
    { he: 'טרפז תחתון', en: 'Lower Trapezius', pct: 25 },
  ],
  'goblet_squat': [
    { he: 'ארבע-ראשי', en: 'Quadriceps', pct: 50 },
    { he: 'עכוז גדול', en: 'Gluteus Maximus', pct: 25 },
    { he: 'מקרב גדול', en: 'Adductor Magnus', pct: 15 },
    { he: 'זוקפי הגב', en: 'Erector Spinae', pct: 10 },
  ],
  'high_to_low_cable_chest_press': [
    { he: 'חזה אמצעי-תחתון', en: 'Sternocostal Pectoralis', pct: 50 },
    { he: 'טרייספס', en: 'Triceps Brachii', pct: 20 },
    { he: 'חזה עליון', en: 'Clavicular Pectoralis', pct: 15 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 15 },
  ],
  'incline_barbell_bench_press': [
    { he: 'חזה עליון', en: 'Clavicular Pectoralis', pct: 34 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 28 },
    { he: 'חזה אמצעי', en: 'Sternocostal Pectoralis', pct: 20 },
    { he: 'טרייספס', en: 'Triceps Brachii', pct: 18 },
  ],
  'incline_dumbbell_bench_press': [
    { he: 'חזה עליון', en: 'Clavicular Pectoralis', pct: 40 },
    { he: 'חזה אמצע', en: 'Sternocostal Pectoralis', pct: 25 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 20 },
    { he: 'טרייספס', en: 'Triceps Brachii', pct: 15 },
  ],
  'incline_dumbbell_biceps_curl': [
    { he: 'ראש ארוך של הבייספס', en: 'Biceps Long Head', pct: 50 },
    { he: 'ראש קצר של הבייספס', en: 'Biceps Short Head', pct: 25 },
    { he: 'ברכיאליס', en: 'Brachialis', pct: 15 },
    { he: 'ברכיורדיאליס', en: 'Brachioradialis', pct: 10 },
  ],
  'kneeling_cable_crunch': [
    { he: 'ישר בטני', en: 'Rectus Abdominis', pct: 70 },
    { he: 'אלכסוני חיצוני', en: 'External Oblique', pct: 15 },
    { he: 'אלכסוני פנימי', en: 'Internal Oblique', pct: 10 },
    { he: 'רחב בטני', en: 'Transversus Abdominis', pct: 5 },
  ],
  'lat_pulldown': [
    { he: 'רחב גבי', en: 'Latissimus Dorsi', pct: 55 },
    { he: 'דו-ראשי זרועי', en: 'Biceps Brachii', pct: 20 },
    { he: 'עגול גדול', en: 'Teres Major', pct: 15 },
    { he: 'טרפז תחתון', en: 'Lower Trapezius', pct: 10 },
  ],
  'lying_leg_raise': [
    { he: 'ישר בטני', en: 'Rectus Abdominis', pct: 40 },
    { he: 'כסל-מותן', en: 'Iliopsoas', pct: 30 },
    { he: 'ישר הירך', en: 'Rectus Femoris', pct: 20 },
    { he: 'אלכסוני הבטן', en: 'Obliques', pct: 10 },
  ],
  'lying_triceps_extension': [
    { he: 'ראש ארוך של הטרייספס', en: 'Triceps Long Head', pct: 50 },
    { he: 'ראש צידי של הטרייספס', en: 'Triceps Lateral Head', pct: 30 },
    { he: 'ראש תיכוני של הטרייספס', en: 'Triceps Medial Head', pct: 20 },
  ],
  'machine_chest_dip': [
    { he: 'חזה תחתון', en: 'Lower Pectoralis', pct: 48 },
    { he: 'טרייספס', en: 'Triceps', pct: 27 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 15 },
    { he: 'מייצבים', en: 'Stabilizers', pct: 10 },
  ],
  'machine_shoulder_press': [
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 45 },
    { he: 'כתף אמצעית', en: 'Lateral Deltoid', pct: 30 },
    { he: 'תלת-ראשי זרועי', en: 'Triceps Brachii', pct: 25 },
  ],
  'machine_squat_hack_squat': [
    { he: 'ארבע ראשי ירך', en: 'Vastus Lateralis', pct: 60 },
    { he: 'רקטוס פמוריס', en: 'Rectus Femoris', pct: 25 },
    { he: 'ואסטוס מדיאליס', en: 'Vastus Medialis', pct: 10 },
    { he: 'ישבן גדול', en: 'Gluteus Maximus', pct: 5 },
  ],
  'machine_squat_hack_squat_2': [
    { he: 'ארבע ראשי', en: 'Quadriceps', pct: 45 },
    { he: 'ישבן גדול', en: 'Gluteus Maximus', pct: 20 },
    { he: 'המסטרינגס', en: 'Hamstrings', pct: 20 },
    { he: 'סולאוס', en: 'Soleus', pct: 15 },
  ],
  'overhead_cable_triceps_extension_2': [
    { he: 'טרייספס – ראש ארוך', en: 'Triceps Long Head', pct: 45 },
    { he: 'טרייספס – ראש לטרלי', en: 'Triceps Lateral Head', pct: 30 },
    { he: 'טרייספס – ראש מדיאלי', en: 'Triceps Medial Head', pct: 25 },
  ],
  'parallel_bar_dips': [
    { he: 'תלת-ראשי', en: 'Triceps Brachii', pct: 60 },
    { he: 'חזה גדול', en: 'Pectoralis Major', pct: 25 },
    { he: 'דלתא קדמית', en: 'Anterior Deltoid', pct: 15 },
  ],
  'pec_deck_chest_fly': [
    { he: 'חזה אמצעי-תחתון', en: 'Sternocostal Pectoralis', pct: 60 },
    { he: 'חזה עליון', en: 'Clavicular Pectoralis', pct: 25 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 15 },
  ],
  'preacher_curl': [
    { he: 'ראש קצר של הבייספס', en: 'Biceps Short Head', pct: 45 },
    { he: 'ראש ארוך של הבייספס', en: 'Biceps Long Head', pct: 30 },
    { he: 'ברכיאליס', en: 'Brachialis', pct: 15 },
    { he: 'ברכיורדיאליס', en: 'Brachioradialis', pct: 10 },
  ],
  'pull_up': [
    { he: 'רחב גבי', en: 'Latissimus Dorsi', pct: 50 },
    { he: 'דו-ראשי זרועי', en: 'Biceps Brachii', pct: 20 },
    { he: 'עגול גדול', en: 'Teres Major', pct: 15 },
    { he: 'טרפז תחתון', en: 'Lower Trapezius', pct: 15 },
  ],
  'reverse_pec_deck_rear_delt_fly': [
    { he: 'כתף צידית', en: 'Lateral Deltoid', pct: 55 },
    { he: 'כתף אחורית', en: 'Posterior Deltoid', pct: 25 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 20 },
  ],
  'romanian_deadlift': [
    { he: 'המסטרינגס', en: 'Hamstrings', pct: 40 },
    { he: 'עכוז גדול', en: 'Gluteus Maximus', pct: 30 },
    { he: 'זוקפי הגב', en: 'Erector Spinae', pct: 20 },
    { he: 'מקרב גדול', en: 'Adductor Magnus', pct: 10 },
  ],
  'seated_cable_row': [
    { he: 'לטיסימוס דורסי', en: 'Latissimus Dorsi', pct: 50 },
    { he: 'רומבואידים', en: 'Rhomboids', pct: 25 },
    { he: 'טרפז אמצעי ותחתון', en: 'Middle & Lower Trapezius', pct: 15 },
    { he: 'בייספס', en: 'Biceps Brachii', pct: 10 },
  ],
  'seated_cable_row_2': [
    { he: 'לטיסימוס', en: 'Latissimus Dorsi', pct: 50 },
    { he: 'לטיסימוס תחתון', en: 'Lower Lat Region', pct: 27 },
    { he: 'לטיסימוס עליון-תורקלי', en: 'Upper Thoracic Lat', pct: 23 },
    { he: 'בייספס', en: 'Biceps', pct: 20 },
    { he: 'אמצע גב', en: 'Mid-Back Retractors', pct: 10 },
    { he: 'טרס מייג׳ור', en: 'Teres Major', pct: 10 },
    { he: 'מייצבי גו', en: 'Trunk Stabilizers', pct: 10 },
  ],
  'seated_hip_abduction': [
    { he: 'עכוז אמצעי', en: 'Gluteus Medius', pct: 45 },
    { he: 'עכוז גדול', en: 'Gluteus Maximus', pct: 25 },
    { he: 'עכוז קטן', en: 'Gluteus Minimus', pct: 20 },
    { he: 'מותח המתלה הרחבה', en: 'Tensor Fasciae Latae', pct: 10 },
  ],
  'seated_leg_curl': [
    { he: 'המסטרינגס', en: 'Hamstrings', pct: 75 },
    { he: 'תאומים', en: 'Gastrocnemius', pct: 15 },
    { he: 'חייט', en: 'Sartorius', pct: 5 },
    { he: 'עדין', en: 'Gracilis', pct: 5 },
  ],
  'seated_leg_extension': [
    { he: 'רקטוס פמוריס', en: 'Rectus Femoris', pct: 45 },
    { he: 'וסטוס לאטרליס', en: 'Vastus Lateralis', pct: 25 },
    { he: 'וסטוס מדיאליס', en: 'Vastus Medialis', pct: 20 },
    { he: 'וסטוס אינטרמדיאוס', en: 'Vastus Intermedius', pct: 10 },
  ],
  'seated_leg_extension_2': [
    { he: 'רחב צידי', en: 'Vastus Lateralis', pct: 30 },
    { he: 'רחב תיכוני', en: 'Vastus Medialis', pct: 25 },
    { he: 'ישר ירכי', en: 'Rectus Femoris', pct: 25 },
    { he: 'רחב ביניים', en: 'Vastus Intermedius', pct: 20 },
  ],
  'seated_machine_chest_press': [
    { he: 'שריר החזה הגדול', en: 'Pectoralis Major', pct: 60 },
    { he: 'דלתא קדמית', en: 'Anterior Deltoid', pct: 20 },
    { he: 'טרייספס', en: 'Triceps Brachii', pct: 15 },
    { he: 'סרייטוס קדמי', en: 'Serratus Anterior', pct: 5 },
  ],
  'seated_machine_chest_press_2': [
    { he: 'חזה אמצעי-תחתון', en: 'Sternocostal Pectoralis', pct: 45 },
    { he: 'חזה עליון', en: 'Clavicular Pectoralis', pct: 20 },
    { he: 'טרייספס', en: 'Triceps Brachii', pct: 20 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 15 },
  ],
  'seated_machine_preacher_curl': [
    { he: 'ברכיאליס', en: 'Brachialis', pct: 35 },
    { he: 'ברכיורדיאליס', en: 'Brachioradialis', pct: 35 },
    { he: 'בייספס', en: 'Biceps Brachii', pct: 30 },
  ],
  'seated_machine_preacher_curl_2': [
    { he: 'דו-ראשי של הזרוע', en: 'Biceps Brachii', pct: 60 },
    { he: 'ברכיאליס', en: 'Brachialis', pct: 30 },
    { he: 'ברכיורדיאליס', en: 'Brachioradialis', pct: 8 },
    { he: 'כופפי שורש היד', en: 'Forearm Flexors', pct: 2 },
  ],
  'seated_machine_shoulder_press': [
    { he: 'דלתואיד קדמי', en: 'Anterior Deltoid', pct: 55 },
    { he: 'דלתואיד צדי', en: 'Lateral Deltoid', pct: 25 },
    { he: 'דלתואיד אחורי', en: 'Posterior Deltoid', pct: 10 },
    { he: 'טרייספס (ראש ארוך)', en: 'Triceps Long Head', pct: 8 },
    { he: 'טרפז עליון/תחתון', en: 'Upper / Lower Trapezius', pct: 2 },
  ],
  'seated_plate_loaded_machine_row': [
    { he: 'לטיסימוס דורסי', en: 'Latissimus Dorsi', pct: 50 },
    { he: 'רומבואידים', en: 'Rhomboids', pct: 25 },
    { he: 'טרפז אמצעי ותחתון', en: 'Middle & Lower Trapezius', pct: 15 },
    { he: 'דלתא אחורי', en: 'Posterior Deltoid', pct: 10 },
  ],
  'single_arm_cross_body_cable_triceps_extension': [
    { he: 'טרייספס – ראש ארוך', en: 'Triceps Long Head', pct: 45 },
    { he: 'טרייספס – ראש לטרלי', en: 'Triceps Lateral Head', pct: 30 },
    { he: 'טרייספס – ראש מדיאלי', en: 'Triceps Medial Head', pct: 25 },
  ],
  'single_arm_dumbbell_row': [
    { he: 'רחב גבי', en: 'Latissimus Dorsi', pct: 40 },
    { he: 'עגול גדול', en: 'Teres Major', pct: 20 },
    { he: 'מעוינים', en: 'Rhomboids', pct: 15 },
    { he: 'טרפז אמצעי', en: 'Middle Trapezius', pct: 15 },
    { he: 'דו-ראשי זרועי', en: 'Biceps Brachii', pct: 10 },
  ],
  'single_arm_landmine_row': [
    { he: 'רחב גבי', en: 'Latissimus Dorsi', pct: 40 },
    { he: 'מעוינים', en: 'Rhomboids', pct: 20 },
    { he: 'טרפז אמצעי', en: 'Middle Trapezius', pct: 15 },
    { he: 'כתף אחורית', en: 'Posterior Deltoid', pct: 10 },
    { he: 'דו-ראשי זרועי', en: 'Biceps Brachii', pct: 10 },
    { he: 'זוקפי הגב', en: 'Erector Spinae', pct: 5 },
  ],
  'smith_machine_bench_press': [
    { he: 'חזה עליון', en: 'Clavicular Pectoralis', pct: 35 },
    { he: 'חזה אמצעי-תחתון', en: 'Sternocostal Pectoralis', pct: 25 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 22 },
    { he: 'טרייספס', en: 'Triceps Brachii', pct: 18 },
  ],
  'smith_machine_squat': [
    { he: 'ארבע-ראשי', en: 'Quadriceps', pct: 45 },
    { he: 'עכוז גדול', en: 'Gluteus Maximus', pct: 30 },
    { he: 'מקרב גדול', en: 'Adductor Magnus', pct: 15 },
    { he: 'זוקפי הגב', en: 'Erector Spinae', pct: 10 },
  ],
  'standard_push_up': [
    { he: 'חזה – אזור אמצעי', en: 'Chest Middle Region', pct: 60 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 20 },
    { he: 'טרייספס', en: 'Triceps', pct: 20 },
  ],
  'standard_push_up_2': [
    { he: 'חזה אמצעי-תחתון', en: 'Sternocostal Pectoralis', pct: 35 },
    { he: 'טרייספס', en: 'Triceps Brachii', pct: 25 },
    { he: 'חזה עליון', en: 'Clavicular Pectoralis', pct: 15 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 15 },
    { he: 'המסור הקדמי', en: 'Serratus Anterior', pct: 10 },
  ],
  'standing_barbell_biceps_curl': [
    { he: 'ראש קצר של הבייספס', en: 'Biceps Short Head', pct: 40 },
    { he: 'ראש ארוך של הבייספס', en: 'Biceps Long Head', pct: 35 },
    { he: 'ברכיאליס', en: 'Brachialis', pct: 15 },
    { he: 'ברכיורדיאליס', en: 'Brachioradialis', pct: 10 },
  ],
  'standing_cable_biceps_curl': [
    { he: 'ראש קצר של הבייספס', en: 'Biceps Short Head', pct: 40 },
    { he: 'ראש ארוך של הבייספס', en: 'Biceps Long Head', pct: 35 },
    { he: 'ברכיאליס', en: 'Brachialis', pct: 15 },
    { he: 'ברכיורדיאליס', en: 'Brachioradialis', pct: 10 },
  ],
  'standing_calf_raise': [
    { he: 'גסטרוקנמיוס', en: 'Gastrocnemius', pct: 70 },
    { he: 'סולאוס', en: 'Soleus', pct: 20 },
    { he: 'פרונאוס לונגוס', en: 'Peroneus Longus', pct: 10 },
  ],
  'standing_calf_raise_2': [
    { he: 'גסטרוקנמיוס', en: 'Gastrocnemius', pct: 70 },
    { he: 'סולאוס', en: 'Soleus', pct: 30 },
  ],
  'standing_dumbbell_biceps_curl': [
    { he: 'ראש קצר של הבייספס', en: 'Biceps Short Head', pct: 40 },
    { he: 'ראש ארוך של הבייספס', en: 'Biceps Long Head', pct: 35 },
    { he: 'ברכיאליס', en: 'Brachialis', pct: 15 },
    { he: 'ברכיורדיאליס', en: 'Brachioradialis', pct: 10 },
  ],
  'standing_dumbbell_hammer_curl': [
    { he: 'ברכיאליס', en: 'Brachialis', pct: 35 },
    { he: 'ברכיורדיאליס', en: 'Brachioradialis', pct: 35 },
    { he: 'בייספס', en: 'Biceps Brachii', pct: 30 },
  ],
  'standing_dumbbell_hammer_curl_2': [
    { he: 'ברכיאליס', en: 'Brachialis', pct: 55 },
    { he: 'ברכיורדיאליס', en: 'Brachioradialis', pct: 25 },
    { he: 'דו-ראשי של הזרוע', en: 'Biceps Brachii', pct: 15 },
    { he: 'אמות היד הכופפים', en: 'Forearm Flexors', pct: 5 },
  ],
  'standing_dumbbell_lateral_raise': [
    { he: 'כתף צידית', en: 'Lateral Deltoid', pct: 55 },
    { he: 'כתף אחורית', en: 'Posterior Deltoid', pct: 25 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 20 },
  ],
  'static_dumbbell_lunge': [
    { he: 'ארבע-ראשי', en: 'Quadriceps', pct: 40 },
    { he: 'עכוז גדול', en: 'Gluteus Maximus', pct: 35 },
    { he: 'מקרב גדול', en: 'Adductor Magnus', pct: 15 },
    { he: 'המסטרינגס', en: 'Hamstrings', pct: 10 },
  ],
  'straight_arm_cable_pulldown': [
    { he: 'רחב גבי', en: 'Latissimus Dorsi', pct: 55 },
    { he: 'עגול גדול', en: 'Teres Major', pct: 20 },
    { he: 'ראש ארוך של הטרייספס', en: 'Triceps Long Head', pct: 15 },
    { he: 'כתף אחורית', en: 'Posterior Deltoid', pct: 10 },
  ],
  'straight_bar_cable_triceps_pushdown': [
    { he: 'טרייספס – ראש ארוך', en: 'Triceps Long Head', pct: 40 },
    { he: 'טרייספס – ראש לטרלי', en: 'Triceps Lateral Head', pct: 35 },
    { he: 'טרייספס – ראש מדיאלי', en: 'Triceps Medial Head', pct: 25 },
  ],
  't_bar_row': [
    { he: 'רחב גבי', en: 'Latissimus Dorsi', pct: 35 },
    { he: 'טרפז אמצעי', en: 'Middle Trapezius', pct: 20 },
    { he: 'מעוינים', en: 'Rhomboids', pct: 15 },
    { he: 'זוקפי הגב', en: 'Erector Spinae', pct: 15 },
    { he: 'דו-ראשי זרועי', en: 'Biceps Brachii', pct: 15 },
  ],
  'upright_row': [
    { he: 'כתף אמצעית', en: 'Lateral Deltoid', pct: 40 },
    { he: 'טרפז עליון', en: 'Upper Trapezius', pct: 35 },
    { he: 'דו-ראשי זרועי', en: 'Biceps Brachii', pct: 15 },
    { he: 'כתף קדמית', en: 'Anterior Deltoid', pct: 10 },
  ],
  'wide_grip_pronated_lat_pulldown': [
    { he: 'לטיסימוס דורסי', en: 'Latissimus Dorsi', pct: 55 },
    { he: 'טרפז תחתון ואמצעי', en: 'Lower & Middle Trapezius', pct: 20 },
    { he: 'דלתא אחורי', en: 'Posterior Deltoid', pct: 15 },
    { he: 'בייספס', en: 'Biceps Brachii', pct: 10 },
  ],
}

/**
 * כרטיסים שאין עליהם אחוזים בכלל.
 *
 * זה כרטיס ה"הסבר" של פשיטת מרפקים מעל הראש — הוא מדרג את שלושת ראשי
 * הטרייספס במילים (Highest / High / Moderate) ולא במספרים. הוא נשאר במאגר
 * התמונות, ופשוט אינו מקור לשיוך.
 */
export const IMAGES_WITHOUT_PERCENTAGES: readonly string[] = ['overhead_cable_triceps_extension']

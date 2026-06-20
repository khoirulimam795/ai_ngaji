import { useState, useEffect } from 'react';

interface TeacherClass {
  id: string;
  classCode: string;
  className: string;
  teacherId: string;
}

// 🔥 FIX: Definisikan interface untuk state teacher agar TypeScript tidak bingung
interface TeacherState {
  id: string;
  classCode: string | null;
  className: string | null;
  onboardingDone: boolean;
}

export function useTeacher() {
  // 🔥 FIX: Gunakan TeacherState | null sebagai tipe data state
  const [teacher, setTeacher] = useState<TeacherState | null>(null);
  const [classes, setClasses] = useState<TeacherClass[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('ngaji_user_role');
    if (role === 'teacher') {
      // Generate teacherId jika belum ada
      let teacherId = localStorage.getItem('ngaji_teacher_id');
      if (!teacherId) {
        teacherId = 'teacher_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
        localStorage.setItem('ngaji_teacher_id', teacherId);
      }

      const allClasses = JSON.parse(localStorage.getItem('ngaji_teacher_classes') || '[]');
      setClasses(allClasses);
      
      const activeCode = localStorage.getItem('ngaji_teacher_active_class');
      let activeClass: TeacherClass | null = null;
      
      if (activeCode) {
        activeClass = allClasses.find((c: TeacherClass) => c.classCode === activeCode) || null;
      } else if (allClasses.length > 0) {
        activeClass = allClasses[0];
        localStorage.setItem('ngaji_teacher_active_class', allClasses[0].classCode);
      }

      setTeacher({
        id: teacherId,
        classCode: activeClass?.classCode || null,
        className: activeClass?.className || null,
        onboardingDone: activeClass !== null
      });
    }
  }, []);

  const switchToTeacher = () => {
    if (!localStorage.getItem('ngaji_teacher_id')) {
      const teacherId = 'teacher_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('ngaji_teacher_id', teacherId);
    }
    localStorage.setItem('ngaji_user_role', 'teacher');
    window.location.reload();
  };

  const switchToStudent = () => {
    localStorage.setItem('ngaji_user_role', 'student');
    window.location.reload();
  };

  const setActiveClass = (classCode: string) => {
    localStorage.setItem('ngaji_teacher_active_class', classCode);
    const active = classes.find(c => c.classCode === classCode);
    
    // 🔥 FIX: Tambahkan tipe data eksplisit (prev: TeacherState | null)
    setTeacher((prev: TeacherState | null) => prev ? { 
      ...prev, 
      classCode: active?.classCode || null, 
      className: active?.className || null 
    } : null);
  };

  const addNewClass = (newClass: TeacherClass) => {
    const updated = [...classes, newClass];
    setClasses(updated);
    localStorage.setItem('ngaji_teacher_classes', JSON.stringify(updated));
    
    // 🔥 FIX: Tambahkan tipe data eksplisit
    setTeacher((prev: TeacherState | null) => prev ? {
      ...prev,
      classCode: newClass.classCode,
      className: newClass.className,
      onboardingDone: true
    } : null);
  };

  const setClassInfo = (code: string, name: string) => {
    localStorage.setItem('ngaji_teacher_class_code', code);
    localStorage.setItem('ngaji_teacher_class_name', name);
    
    // 🔥 FIX: Tambahkan tipe data eksplisit
    setTeacher((prev: TeacherState | null) => prev ? { 
      ...prev, 
      classCode: code, 
      className: name,
      onboardingDone: true
    } : null);
  };

  const setOnboardingDone = (done: boolean) => {
    localStorage.setItem('ngaji_onboarding_done', done.toString());
    
    // 🔥 FIX: Tambahkan tipe data eksplisit
    setTeacher((prev: TeacherState | null) => prev ? { ...prev, onboardingDone: done } : null);
  };

  return {
    teacher,
    classes,
    switchToTeacher,
    switchToStudent,
    setActiveClass,
    addNewClass,
    setClassInfo,
    setOnboardingDone
  };
}
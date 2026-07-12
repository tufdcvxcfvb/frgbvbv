export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  deviceId: string;
  browser: string;
  os: string;
  platform: string;
  ip: string;
  createdAt: string;
  lastLogin: string;
  lastSeen: string;
  photoURL?: string;
  devToolOpenCount: number;
  devToolTotalTime: number; // in seconds
  blocked: boolean;
}

export interface Course {
  courseId: string;
  title: string;
  thumbnail: string;
  description: string;
  createdAt: string;
}

export interface Subject {
  subjectId: string;
  courseId: string;
  title: string;
  thumbnail: string;
  createdAt: string;
  lectureCount?: number;
}

export interface Lecture {
  lectureId: string;
  subjectId: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  pdfUrl?: string;
  duration: string;
  createdAt: string;
}

export interface DeviceLog {
  logId?: string;
  uid: string;
  deviceId: string;
  openedAt: string;
  closedAt: string;
  duration: number; // in seconds
  browser: string;
  os: string;
  platform: string;
  userAgent: string;
  screenSize: string;
  timestamp: string;
}

export interface BlockedDevice {
  deviceId: string;
  blockedAt: string;
  reason: string;
}

export interface Setting {
  key: string;
  value: string;
}

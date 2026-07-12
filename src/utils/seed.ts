import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

export async function seedDatabase() {
  try {
    const coursesCol = collection(db, 'courses');
    const coursesSnapshot = await getDocs(coursesCol);
    
    if (!coursesSnapshot.empty) {
      console.log('Database already seeded.');
      return;
    }

    console.log('Seeding database with premium learning content...');
    const batch = writeBatch(db);

    const courses = [
      {
        courseId: 'typescript-react',
        title: 'Mastering TypeScript & Modern React',
        description: 'Deep dive into type-safe fullstack engineering, React 19 architecture, complex state coordination, and modern motion graphics.',
        thumbnail: 'https://images.unsplash.com/photo-1516116211223-5c359a36298a?w=800&auto=format&fit=crop&q=60',
        createdAt: new Date().toISOString()
      },
      {
        courseId: 'cloud-architecture',
        title: 'Cloud Systems & Scalable Architectures',
        description: 'Design and deploy modern serverless stacks, microservices with containers, edge routing networks, and secure Firestore architectures.',
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
        createdAt: new Date().toISOString()
      },
      {
        courseId: 'gemini-ai',
        title: 'AI Product Engineering with Gemini SDK',
        description: 'Harness the power of Gemini 2.0 multi-modal agents, function calling, vector database embeddings, and structured schema pipelines.',
        thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=60',
        createdAt: new Date().toISOString()
      }
    ];

    const subjects = [
      // TypeScript Course Subjects
      {
        subjectId: 'ts-foundations',
        courseId: 'typescript-react',
        title: 'TypeScript Foundations & Type Safety',
        thumbnail: 'https://images.unsplash.com/photo-1516116211223-5c359a36298a?w=400&auto=format&fit=crop&q=60',
        createdAt: new Date().toISOString()
      },
      {
        subjectId: 'react-patterns',
        courseId: 'typescript-react',
        title: 'Advanced React 19 Design Patterns',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&auto=format&fit=crop&q=60',
        createdAt: new Date().toISOString()
      },

      // Cloud Architecture Course Subjects
      {
        subjectId: 'firebase-mastery',
        courseId: 'cloud-architecture',
        title: 'Firebase Masterclass & Security ABAC',
        thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=60',
        createdAt: new Date().toISOString()
      },
      {
        subjectId: 'docker-kubernetes',
        courseId: 'cloud-architecture',
        title: 'Microservices & Container Virtualization',
        thumbnail: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=400&auto=format&fit=crop&q=60',
        createdAt: new Date().toISOString()
      },

      // Gemini Course Subjects
      {
        subjectId: 'gemini-fundamentals',
        courseId: 'gemini-ai',
        title: 'Gemini API Integration & Prompt Pipelines',
        thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&auto=format&fit=crop&q=60',
        createdAt: new Date().toISOString()
      },
      {
        subjectId: 'ai-agents',
        courseId: 'gemini-ai',
        title: 'Agentic Workflows & Multi-Modal Assistants',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60',
        createdAt: new Date().toISOString()
      }
    ];

    const lectures = [
      // ts-foundations Lectures
      {
        lectureId: 'ts-lec-1',
        subjectId: 'ts-foundations',
        title: 'Introduction to Strict Typing & Intersection Types',
        thumbnail: 'https://images.unsplash.com/photo-1516116211223-5c359a36298a?w=400&auto=format&fit=crop&q=60',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        duration: '10:00',
        createdAt: new Date().toISOString()
      },
      {
        lectureId: 'ts-lec-2',
        subjectId: 'ts-foundations',
        title: 'Generics, Conditional Types, and Mapped Shapes',
        thumbnail: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=400&auto=format&fit=crop&q=60',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        duration: '15:30',
        createdAt: new Date().toISOString()
      },
      {
        lectureId: 'ts-lec-3',
        subjectId: 'ts-foundations',
        title: 'Discriminated Unions & Assertion Guards',
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop&q=60',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        duration: '12:15',
        createdAt: new Date().toISOString()
      },

      // react-patterns Lectures
      {
        lectureId: 'react-lec-1',
        subjectId: 'react-patterns',
        title: 'Mastering Custom Hooks & Context Optimization',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&auto=format&fit=crop&q=60',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        duration: '14:20',
        createdAt: new Date().toISOString()
      },
      {
        lectureId: 'react-lec-2',
        subjectId: 'react-patterns',
        title: 'Framer Motion: Transitions, Liquid Sidebar & Custom Physics',
        thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&auto=format&fit=crop&q=60',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        duration: '18:45',
        createdAt: new Date().toISOString()
      },

      // firebase-mastery Lectures
      {
        lectureId: 'fb-lec-1',
        subjectId: 'fb-foundations', // Wait, the subjectId is fb-foundations but the subject we created is firebase-mastery. Let's make sure it is firebase-mastery!
        title: 'Firestore ABAC Rules & Token-based Claims',
        thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=60',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        duration: '22:10',
        createdAt: new Date().toISOString()
      },

      // gemini-fundamentals Lectures
      {
        lectureId: 'gemini-lec-1',
        subjectId: 'gemini-fundamentals',
        title: 'Gemini 2.0 SDK Essentials: Models, Tokens & Chat Sessions',
        thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&auto=format&fit=crop&q=60',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        duration: '13:05',
        createdAt: new Date().toISOString()
      },
      {
        lectureId: 'gemini-lec-2',
        subjectId: 'gemini-fundamentals',
        title: 'HLS Live Streaming & Realtime Transcripts',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60',
        videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        duration: '19:50',
        createdAt: new Date().toISOString()
      }
    ];

    // Correct the subjectId for fb-lec-1
    lectures.forEach(lec => {
      if (lec.lectureId === 'fb-lec-1') {
        lec.subjectId = 'firebase-mastery';
      }
    });

    // Write courses
    courses.forEach(course => {
      const docRef = doc(db, 'courses', course.courseId);
      batch.set(docRef, course);
    });

    // Write subjects
    subjects.forEach(subject => {
      const docRef = doc(db, 'subjects', subject.subjectId);
      batch.set(docRef, subject);
    });

    // Write lectures
    lectures.forEach(lecture => {
      const docRef = doc(db, 'lectures', lecture.lectureId);
      batch.set(docRef, lecture);
    });

    // Write connection test settings doc
    batch.set(doc(db, 'settings', 'connection-test'), { status: 'active', timestamp: new Date().toISOString() });

    await batch.commit();
    console.log('Database successfully seeded with premium content!');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

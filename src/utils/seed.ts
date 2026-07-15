import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * seedDatabase is now empty to avoid adding "fake" courses.
 * Administrator can add real courses via the Admin Panel.
 */
export async function seedDatabase() {
  console.log('Seed database called - currently disabled to prevent fake course creation.');
}

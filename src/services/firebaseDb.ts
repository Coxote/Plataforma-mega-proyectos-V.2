import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Project, Client, UserSession } from '../types';

export const PROJECTS_COL = 'projects';
export const CLIENTS_COL = 'clients';
export const USERS_COL = 'users';

/**
 * Suscripción en tiempo real a los proyectos en Cloud Firestore.
 */
export function subscribeProjects(
  onProjects: (projects: Project[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, PROJECTS_COL),
    (snapshot) => {
      const projects: Project[] = [];
      snapshot.forEach((docSnap) => {
        projects.push(docSnap.data() as Project);
      });
      // Ordenar por fecha de creación descendente si aplica
      projects.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onProjects(projects);
    },
    (error) => {
      console.warn('Firestore subscription warning (Projects):', error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Guarda o actualiza un proyecto en Cloud Firestore.
 */
export async function saveProjectToFirestore(project: Project): Promise<void> {
  try {
    const docRef = doc(db, PROJECTS_COL, project.id);
    await setDoc(docRef, project, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${PROJECTS_COL}/${project.id}`);
  }
}

/**
 * Elimina un proyecto en Cloud Firestore.
 */
export async function deleteProjectFromFirestore(projectId: string): Promise<void> {
  try {
    const docRef = doc(db, PROJECTS_COL, projectId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PROJECTS_COL}/${projectId}`);
  }
}

/**
 * Suscripción en tiempo real a Clientes.
 */
export function subscribeClients(
  onClients: (clients: Client[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, CLIENTS_COL),
    (snapshot) => {
      const clients: Client[] = [];
      snapshot.forEach((docSnap) => {
        clients.push(docSnap.data() as Client);
      });
      onClients(clients);
    },
    (error) => {
      console.warn('Firestore subscription warning (Clients):', error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Guarda o actualiza un cliente en Firestore.
 */
export async function saveClientToFirestore(client: Client): Promise<void> {
  try {
    const docRef = doc(db, CLIENTS_COL, client.id);
    await setDoc(docRef, client, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${CLIENTS_COL}/${client.id}`);
  }
}

/**
 * Suscripción en tiempo real a Usuarios en Cloud Firestore.
 */
export function subscribeUsers(
  onUsers: (users: UserSession[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, USERS_COL),
    (snapshot) => {
      const users: UserSession[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as UserSession);
      });
      if (users.length > 0) {
        onUsers(users);
      }
    },
    (error) => {
      console.warn('Firestore subscription warning (Users):', error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Guarda o actualiza un usuario en Cloud Firestore.
 */
export async function saveUserToFirestore(user: UserSession): Promise<void> {
  try {
    const docRef = doc(db, USERS_COL, user.id);
    await setDoc(docRef, user, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COL}/${user.id}`);
  }
}

/**
 * Elimina un usuario de Cloud Firestore.
 */
export async function deleteUserFromFirestore(userId: string): Promise<void> {
  try {
    const docRef = doc(db, USERS_COL, userId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${USERS_COL}/${userId}`);
  }
}

/**
 * Autentica o aprueba a un usuario pendiente en Cloud Firestore.
 */
export async function authenticateOrApproveUserInFirestore(
  userId: string,
  approvedByUsername: string
): Promise<void> {
  try {
    const docRef = doc(db, USERS_COL, userId);
    await setDoc(
      docRef,
      {
        estado: 'activo',
        autenticadoPor: approvedByUsername,
        fechaAutenticacion: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COL}/${userId}`);
  }
}

/**
 * Inicializa la base de datos si está vacía (Seed Inicial en la nube).
 */
export async function seedFirestoreIfEmpty(
  defaultProjects: Project[],
  defaultClients: Client[],
  defaultUsers: UserSession[]
): Promise<void> {
  try {
    const projectsSnap = await getDocs(collection(db, PROJECTS_COL));
    if (projectsSnap.empty) {
      console.log('Sembrando proyectos iniciales en Cloud Firestore...');
      for (const p of defaultProjects) {
        await setDoc(doc(db, PROJECTS_COL, p.id), p);
      }
    }

    const clientsSnap = await getDocs(collection(db, CLIENTS_COL));
    if (clientsSnap.empty) {
      console.log('Sembrando clientes iniciales en Cloud Firestore...');
      for (const c of defaultClients) {
        await setDoc(doc(db, CLIENTS_COL, c.id), c);
      }
    }

    const usersSnap = await getDocs(collection(db, USERS_COL));
    if (usersSnap.empty) {
      console.log('Sembrando usuarios en Cloud Firestore...');
      for (const u of defaultUsers) {
        await setDoc(doc(db, USERS_COL, u.id), u);
      }
    }
  } catch (err) {
    console.warn('Seed verification note:', err);
  }
}

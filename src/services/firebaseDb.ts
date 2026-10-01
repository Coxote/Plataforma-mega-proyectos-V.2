import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { Project, Client, UserSession } from '../types';

export const APP_ENVIRONMENT_ID = 'prod_v1';
export const PROJECTS_COL = 'projects';
export const CLIENTS_COL = 'clients';
export const USERS_COL = 'users';
export const PLANNER_TASKS_COL = 'plannerTasks';

export interface PlannerTaskRecord {
  id: string;
  brand: string;
  project: string;
  projectId?: string;
  start: string;
  deadline: string;
  assignedTo?: string;
  assignedToUsers?: string[];
  status: 'pendiente' | 'proceso' | 'completado';
  priority?: 'alta' | 'media' | 'baja';
  estimatedHours?: number;
}

function sanitizeUserForFirestore(user: UserSession): UserSession {
  const { password, ...safeUser } = user;
  return safeUser;
}

function withEnvironment<T extends Record<string, any>>(record: T): T {
  return { ...record, environmentId: APP_ENVIRONMENT_ID };
}

function isCurrentEnvironment(record: any): boolean {
  return record?.environmentId === APP_ENVIRONMENT_ID;
}

/**
 * Suscripción en tiempo real a los proyectos en Cloud Firestore.
 */
export function subscribeProjects(
  onProjects: (projects: Project[]) => void,
  onError?: (err: any) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }

  return onSnapshot(
    collection(db, PROJECTS_COL),
    (snapshot) => {
      const projects: Project[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (isCurrentEnvironment(data)) {
          projects.push(data as Project);
        }
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
  if (!auth.currentUser) {
    return;
  }

  try {
    const docRef = doc(db, PROJECTS_COL, project.id);
    await setDoc(docRef, withEnvironment(project), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${PROJECTS_COL}/${project.id}`);
  }
}

/**
 * Elimina un proyecto en Cloud Firestore.
 */
export async function deleteProjectFromFirestore(projectId: string): Promise<void> {
  if (!auth.currentUser) {
    return;
  }

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
  if (!auth.currentUser) {
    return () => {};
  }

  return onSnapshot(
    collection(db, CLIENTS_COL),
    (snapshot) => {
      const clients: Client[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (isCurrentEnvironment(data)) {
          clients.push(data as Client);
        }
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
 * Guarda o actualiza un cliente en Cloud Firestore.
 */
export async function saveClientToFirestore(client: Client): Promise<void> {
  if (!auth.currentUser) {
    return;
  }

  try {
    const docRef = doc(db, CLIENTS_COL, client.id);
    await setDoc(docRef, withEnvironment(client), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${CLIENTS_COL}/${client.id}`);
  }
}

/**
 * Elimina un cliente de Cloud Firestore.
 */
export async function deleteClientFromFirestore(clientId: string): Promise<void> {
  if (!auth.currentUser) {
    return;
  }

  try {
    const docRef = doc(db, CLIENTS_COL, clientId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${CLIENTS_COL}/${clientId}`);
  }
}

/**
 * Suscripción en tiempo real a Usuarios registrados en el sistema.
 */
export function subscribeUsers(
  onUsers: (users: UserSession[]) => void,
  onError?: (err: any) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }

  return onSnapshot(
    collection(db, USERS_COL),
    (snapshot) => {
      const users: UserSession[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (isCurrentEnvironment(data)) {
          users.push(data as UserSession);
        }
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
  if (!auth.currentUser) {
    return;
  }

  try {
    const docRef = doc(db, USERS_COL, user.id);
    await setDoc(docRef, withEnvironment(sanitizeUserForFirestore(user)), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COL}/${user.id}`);
  }
}

/**
 * Elimina un usuario de Cloud Firestore.
 */
export async function deleteUserFromFirestore(userId: string): Promise<void> {
  if (!auth.currentUser) {
    return;
  }

  try {
    const docRef = doc(db, USERS_COL, userId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${USERS_COL}/${userId}`);
  }
}

/**
 * Suscripción en tiempo real a las tareas del planner.
 */
export function subscribePlannerTasks(
  onTasks: (tasks: PlannerTaskRecord[]) => void,
  onError?: (err: any) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }

  return onSnapshot(
    collection(db, PLANNER_TASKS_COL),
    (snapshot) => {
      const tasks: PlannerTaskRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (isCurrentEnvironment(data)) {
          tasks.push(data as PlannerTaskRecord);
        }
      });
      tasks.sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));
      onTasks(tasks);
    },
    (error) => {
      console.warn('Firestore subscription warning (Planner Tasks):', error.message);
      if (onError) onError(error);
    }
  );
}

export async function savePlannerTaskToFirestore(task: PlannerTaskRecord): Promise<void> {
  if (!auth.currentUser) {
    return;
  }

  try {
    const docRef = doc(db, PLANNER_TASKS_COL, task.id);
    await setDoc(docRef, withEnvironment(task), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${PLANNER_TASKS_COL}/${task.id}`);
  }
}

export async function deletePlannerTaskFromFirestore(taskId: string): Promise<void> {
  if (!auth.currentUser) {
    return;
  }

  try {
    const docRef = doc(db, PLANNER_TASKS_COL, taskId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PLANNER_TASKS_COL}/${taskId}`);
  }
}

export async function seedPlannerTasksIfEmpty(defaultTasks: PlannerTaskRecord[]): Promise<void> {
  if (!auth.currentUser) {
    return;
  }

  try {
    const tasksSnap = await getDocs(collection(db, PLANNER_TASKS_COL));
    if (tasksSnap.empty) {
      console.log('Sembrando tareas iniciales del planner en Cloud Firestore...');
      for (const task of defaultTasks) {
        await setDoc(doc(db, PLANNER_TASKS_COL, task.id), task);
      }
    }
  } catch (err) {
    console.warn('Planner seed verification note:', err);
  }
}

/**
 * Autentica o aprueba a un usuario pendiente en Cloud Firestore.
 */
export async function authenticateOrApproveUserInFirestore(
  userId: string,
  approvedByUsername: string
): Promise<void> {
  if (!auth.currentUser) {
    return;
  }

  try {
    const docRef = doc(db, USERS_COL, userId);
    await setDoc(
      docRef,
      {
        estado: 'activo',
        autenticadoPor: approvedByUsername,
        fechaAutenticacion: new Date().toISOString(),
        environmentId: APP_ENVIRONMENT_ID,
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
  if (!auth.currentUser) {
    return;
  }

  try {
    const projectsSnap = await getDocs(collection(db, PROJECTS_COL));
    if (!projectsSnap.docs.some((docSnap) => isCurrentEnvironment(docSnap.data()))) {
      console.log('Sembrando proyectos iniciales en Cloud Firestore...');
      for (const p of defaultProjects) {
        await setDoc(doc(db, PROJECTS_COL, p.id), withEnvironment(p));
      }
    }

    const clientsSnap = await getDocs(collection(db, CLIENTS_COL));
    if (!clientsSnap.docs.some((docSnap) => isCurrentEnvironment(docSnap.data()))) {
      console.log('Sembrando clientes iniciales en Cloud Firestore...');
      for (const c of defaultClients) {
        await setDoc(doc(db, CLIENTS_COL, c.id), withEnvironment(c));
      }
    }

    const usersSnap = await getDocs(collection(db, USERS_COL));
    if (!usersSnap.docs.some((docSnap) => isCurrentEnvironment(docSnap.data()))) {
      console.log('Sembrando usuarios en Cloud Firestore...');
      for (const u of defaultUsers) {
        await setDoc(doc(db, USERS_COL, u.id), withEnvironment(sanitizeUserForFirestore(u)));
      }
    }
  } catch (err) {
    console.warn('Seed verification note:', err);
  }
}

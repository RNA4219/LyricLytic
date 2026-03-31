import { invoke } from '@tauri-apps/api/core';
import { CreateProjectInput, Project, UpdateProjectInput } from './types';

export async function getProjects(): Promise<Project[]> {
  return invoke('get_projects');
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  return invoke('create_project', { input });
}

export async function getProject(projectId: string): Promise<Project> {
  return invoke('get_project', { projectId });
}

export async function updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
  return invoke('update_project', { projectId, input });
}

export async function deleteProject(projectId: string): Promise<void> {
  return invoke('delete_project', { projectId });
}

export async function getDeletedProjects(): Promise<Project[]> {
  return invoke('get_deleted_projects');
}

export async function restoreProject(projectId: string, batchId: string): Promise<void> {
  return invoke('restore_project', { projectId, batchId });
}

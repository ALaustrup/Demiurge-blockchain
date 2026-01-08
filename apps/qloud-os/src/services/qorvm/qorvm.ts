/**
 * AbyssVM - Main Interface
 * 
 * The Demiurge Virtual Machine
 */

function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
import { jobScheduler } from './scheduler';
import type { VMJob, VMExecutionResult, VMABI, VMJobOptions } from './types';

/**
 * Submit a job to AbyssVM
 */
export async function submitVMJob(
  wasmModuleId: string,
  input: any,
  abi: VMABI,
  options?: VMJobOptions
): Promise<VMExecutionResult> {
  const job: VMJob = {
    jobId: `job:${randomUUID()}`,
    wasmModuleId,
    input,
    options,
  };
  
  return jobScheduler.submitJob(job, abi);
}

/**
 * Cancel a running job
 */
export function cancelVMJob(jobId: string): boolean {
  return jobScheduler.cancelJob(jobId);
}

/**
 * Get job status
 */
export function getVMJobStatus(jobId: string) {
  return jobScheduler.getJobStatus(jobId);
}

/**
 * Get all jobs
 */
export function getAllVMJobs() {
  return jobScheduler.getAllJobs();
}

/**
 * Subscribe to job updates
 */
export function onVMJobUpdate(callback: (status: any) => void) {
  return jobScheduler.onJobUpdate(callback);
}


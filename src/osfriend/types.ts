export interface UserContext {

  os: string, 
  shell: string, 
  package_manager?: string,
  distro?: string,
  version?: string, 

}

export interface RetryContext {
  last_prompt: string,
  last_error: string

}

export interface UserRequest {
  context: UserContext,
  prompt: string, 
  retry_context?: RetryContext
}
export interface OSFriendResponse {
  command: string 
}

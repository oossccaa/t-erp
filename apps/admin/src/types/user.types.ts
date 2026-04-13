import type { BaseEntity } from './api.types'

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface User extends BaseEntity {
  username: string
  email: string
  role: UserRole
  isActive: boolean
}

export interface UserProfile {
  id: number
  username: string
  email: string
  role: UserRole
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: UserProfile
}

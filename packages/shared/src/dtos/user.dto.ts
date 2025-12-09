import { UserRole } from '../enums'

export interface CreateUserDto {
  username: string
  email: string
  password: string
  role?: UserRole
}

export interface UpdateUserDto {
  username?: string
  email?: string
  role?: UserRole
  isActive?: boolean
}

export interface ChangePasswordDto {
  oldPassword: string
  newPassword: string
}
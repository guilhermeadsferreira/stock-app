import type { Business, BusinessMember } from '@/domain/types'

export interface IBusinessRepository {
  findById(businessId: string): Promise<Business | null>
  findByInviteCode(code: string): Promise<Business | null>
  create(name: string, ownerId: string, ownerEmail: string): Promise<Business>
  getMemberCount(businessId: string): Promise<number>
  addMember(businessId: string, userId: string, userEmail: string): Promise<void>
  removeMember(businessId: string, userId: string): Promise<void>
  regenerateInviteCode(businessId: string): Promise<string>
  listMembers(businessId: string): Promise<BusinessMember[]>
  update(businessId: string, data: Partial<Pick<Business, 'name' | 'lowStockThreshold' | 'expirationAlertDays'>>): Promise<Business>
}

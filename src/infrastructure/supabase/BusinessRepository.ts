import type { SupabaseClient } from '@supabase/supabase-js'
import type { IBusinessRepository } from '@/domain/repositories/IBusinessRepository'
import type { Business, BusinessMember } from '@/domain/types'

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBusiness(row: any): Business {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    inviteCode: row.invite_code,
    lowStockThreshold: row.low_stock_threshold,
    expirationAlertDays: row.expiration_alert_days,
    createdAt: new Date(row.created_at),
  }
}

export class BusinessRepository implements IBusinessRepository {
  constructor(private readonly client: SupabaseClient<any, any, any>) {} // eslint-disable-line @typescript-eslint/no-explicit-any

  async findById(businessId: string): Promise<Business | null> {
    const { data, error } = await this.client
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()
    if (error || !data) return null
    return mapBusiness(data)
  }

  async findByInviteCode(code: string): Promise<Business | null> {
    const { data, error } = await this.client
      .from('businesses')
      .select('*')
      .eq('invite_code', code)
      .single()
    // PGRST116 = "no rows returned" — código não encontrado
    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    if (!data) return null
    return mapBusiness(data)
  }

  async listForUser(userId: string): Promise<Business[]> {
    const { data, error } = await this.client
      .from('user_business')
      .select('business_id, businesses(*)')
      .eq('user_id', userId)
    if (error) throw new Error(`listForUser failed: ${error.code} — ${error.message}`)
    if (!data) return []
    return data
      .map((row: any) => row.businesses) // eslint-disable-line @typescript-eslint/no-explicit-any
      .filter(Boolean)
      .map(mapBusiness)
  }

  async create(name: string, ownerId: string, ownerEmail: string): Promise<Business> {
    const inviteCode = generateCode()
    const id = crypto.randomUUID()
    const createdAt = new Date()

    const { error: bizError } = await this.client
      .from('businesses')
      .insert({ id, name, owner_id: ownerId, invite_code: inviteCode })
    if (bizError) throw new Error(bizError.message)

    // Dual-write: mantém user_profiles.business_id + escreve na junction
    await this.client
      .from('user_profiles')
      .upsert({ id: ownerId, email: ownerEmail, business_id: id })

    await this.client
      .from('user_business')
      .upsert({ user_id: ownerId, business_id: id, role: 'owner' })

    return { id, name, ownerId, inviteCode, lowStockThreshold: 5, expirationAlertDays: 7, createdAt }
  }

  async getMemberCount(businessId: string): Promise<number> {
    const { count } = await this.client
      .from('user_business')
      .select('user_id', { count: 'exact', head: true })
      .eq('business_id', businessId)
    return count ?? 0
  }

  async addMember(businessId: string, userId: string, userEmail: string): Promise<void> {
    // Dual-write: mantém user_profiles.business_id + escreve na junction
    await this.client
      .from('user_profiles')
      .upsert({ id: userId, email: userEmail, business_id: businessId })

    await this.client
      .from('user_business')
      .upsert({ user_id: userId, business_id: businessId, role: 'member' })
  }

  async removeMember(businessId: string, userId: string): Promise<void> {
    // Remove da junction table
    await this.client
      .from('user_business')
      .delete()
      .eq('user_id', userId)
      .eq('business_id', businessId)

    // Mantém user_profiles consistente durante a transição
    await this.client
      .from('user_profiles')
      .update({ business_id: null })
      .eq('id', userId)
      .eq('business_id', businessId)
  }

  async regenerateInviteCode(businessId: string): Promise<string> {
    const newCode = generateCode()
    await this.client
      .from('businesses')
      .update({ invite_code: newCode })
      .eq('id', businessId)
    return newCode
  }

  async listMembers(businessId: string): Promise<BusinessMember[]> {
    const { data: biz } = await this.client
      .from('businesses')
      .select('owner_id')
      .eq('id', businessId)
      .single()

    const { data: members } = await this.client
      .from('user_business')
      .select('user_id, role, user_profiles(email)')
      .eq('business_id', businessId)

    if (!members) return []

    return members.map((m: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      id: m.user_id,
      email: m.user_profiles?.email ?? '',
      isOwner: m.user_id === biz?.owner_id,
    }))
  }

  async update(
    businessId: string,
    data: Partial<Pick<Business, 'name' | 'lowStockThreshold' | 'expirationAlertDays'>>,
  ): Promise<Business> {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.lowStockThreshold !== undefined) updateData.low_stock_threshold = data.lowStockThreshold
    if (data.expirationAlertDays !== undefined) updateData.expiration_alert_days = data.expirationAlertDays

    const { data: row, error } = await this.client
      .from('businesses')
      .update(updateData)
      .eq('id', businessId)
      .select()
      .single()
    if (error || !row) throw new Error(error?.message ?? 'Erro ao atualizar empresa')
    return mapBusiness(row)
  }
}

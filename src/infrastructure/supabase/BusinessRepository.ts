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

  async create(name: string, ownerId: string, ownerEmail: string): Promise<Business> {
    const inviteCode = generateCode()
    const id = crypto.randomUUID()
    const createdAt = new Date()

    const { error: bizError } = await this.client
      .from('businesses')
      .insert({ id, name, owner_id: ownerId, invite_code: inviteCode })
    if (bizError) throw new Error(bizError.message)

    await this.client
      .from('user_profiles')
      .upsert({ id: ownerId, email: ownerEmail, business_id: id })

    return { id, name, ownerId, inviteCode, lowStockThreshold: 5, expirationAlertDays: 7, createdAt }
  }

  async getMemberCount(businessId: string): Promise<number> {
    const { count } = await this.client
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
    return count ?? 0
  }

  async addMember(businessId: string, userId: string, userEmail: string): Promise<void> {
    await this.client
      .from('user_profiles')
      .upsert({ id: userId, email: userEmail, business_id: businessId })
  }

  async removeMember(businessId: string, userId: string): Promise<void> {
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

    const { data: profiles } = await this.client
      .from('user_profiles')
      .select('id, email')
      .eq('business_id', businessId)

    if (!profiles) return []

    return profiles.map((p: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      id: p.id,
      email: p.email,
      isOwner: p.id === biz?.owner_id,
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

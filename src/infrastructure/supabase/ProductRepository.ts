import type { SupabaseClient } from '@supabase/supabase-js'
import type { IProductRepository, ProductFilters } from '@/domain/repositories/IProductRepository'
import type { Product } from '@/domain/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Product {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    brand: row.brand ?? null,
    barcode: row.barcode ?? null,
    purchasePrice: row.purchase_price,
    salePrice: row.sale_price,
    notes: row.notes ?? null,
    expirationDate: row.expiration_date ? new Date(row.expiration_date) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export class ProductRepository implements IProductRepository {
  constructor(private readonly client: SupabaseClient<any, any, any>) {} // eslint-disable-line @typescript-eslint/no-explicit-any

  async findById(businessId: string, productId: string): Promise<Product | null> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('business_id', businessId)
      .single()
    if (error || !data) return null
    return mapRow(data)
  }

  async findByBarcode(businessId: string, barcode: string): Promise<Product | null> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .eq('barcode', barcode)
      .single()
    if (error || !data) return null
    return mapRow(data)
  }

  async list(businessId: string, filters?: ProductFilters): Promise<Product[]> {
    let query = this.client
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true })

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    const { data, error } = await query
    if (error || !data) return []
    return data.map(mapRow)
  }

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const { data, error } = await this.client
      .from('products')
      .insert({
        business_id: product.businessId,
        name: product.name,
        brand: product.brand,
        barcode: product.barcode,
        purchase_price: product.purchasePrice,
        sale_price: product.salePrice,
        notes: product.notes,
        expiration_date: product.expirationDate?.toISOString() ?? null,
      })
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Erro ao criar produto')
    return mapRow(data)
  }

  async update(
    businessId: string,
    productId: string,
    data: Partial<Omit<Product, 'id' | 'businessId' | 'createdAt'>>,
  ): Promise<Product> {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.brand !== undefined) updateData.brand = data.brand
    if (data.barcode !== undefined) updateData.barcode = data.barcode
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.purchasePrice !== undefined) updateData.purchase_price = data.purchasePrice
    if (data.salePrice !== undefined) updateData.sale_price = data.salePrice
    if (data.expirationDate !== undefined) updateData.expiration_date = data.expirationDate?.toISOString() ?? null
    updateData.updated_at = new Date().toISOString()

    const { data: row, error } = await this.client
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .eq('business_id', businessId)
      .select()
      .single()
    if (error || !row) throw new Error(error?.message ?? 'Erro ao atualizar produto')
    return mapRow(row)
  }

  async delete(businessId: string, productId: string): Promise<void> {
    const { error } = await this.client
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('business_id', businessId)
    if (error) throw new Error(error.message)
  }
}

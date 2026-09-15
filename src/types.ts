export type Role = 'customer' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string | null
  cpf: string | null
  role: Role
  created_at: string
}

export interface Section {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  categories: string[]
  cover_url: string | null
  cover_path: string | null
  sort_order: number
  active: boolean
}

export interface Collection {
  id: string
  slug: string
  name: string
  description: string | null
  section_id: string | null
  cover_url: string | null
  cover_path: string | null
  sort_order: number
  active: boolean
  created_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  path: string | null
  alt: string | null
  color_name: string | null
  sort_order: number
}

export interface ProductVariant {
  id: string
  product_id: string
  color_name: string
  color_hex: string
  size: string
  sku: string | null
  stock: number
  sort_order: number
}

export type ProductTag = 'novo' | 'mais-vendido' | 'destaque'

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  details: string[]
  section_id: string
  collection_id: string | null
  category: string | null
  price: number
  compare_at_price: number | null
  tags: ProductTag[]
  active: boolean
  created_at: string
  section: Pick<Section, 'id' | 'slug' | 'name'> | null
  collection: Pick<Collection, 'id' | 'slug' | 'name'> | null
  images: ProductImage[]
  variants: ProductVariant[]
}

export type DiscountType = 'percent' | 'fixed' | 'free_shipping'

export interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: DiscountType
  value: number
  min_subtotal: number
  max_uses: number | null
  used_count: number
  starts_at: string | null
  expires_at: string | null
  active: boolean
  created_at: string
}

export interface AppliedCoupon {
  code: string
  description: string | null
  discount_type: DiscountType
  value: number
  min_subtotal: number
}

export interface CartItem {
  /** id da variação (cor + tamanho) */
  key: string
  variantId: string
  productId: string
  slug: string
  name: string
  price: number
  image: string | null
  color: string
  colorHex: string
  size: string
  stock: number
  qty: number
}

export type PaymentMethod = 'pix' | 'card' | 'boleto'
export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'

export interface ShippingOption {
  id: 'pac' | 'sedex' | 'retirada'
  label: string
  eta: string
  price: number
}

export interface Address {
  cep: string
  street: string
  number: string
  complement: string
  district: string
  city: string
  state: string
}

export interface Customer {
  name: string
  email: string
  cpf: string
  phone: string
}

export interface OrderItem {
  id: string
  product_id: string | null
  variant_id: string | null
  product_name: string
  product_slug: string | null
  image_url: string | null
  color_name: string
  size: string
  quantity: number
  unit_price: number
}

export interface Order {
  id: string
  number: string
  user_id: string | null
  status: OrderStatus
  customer: Customer
  shipping_address: Address | null
  shipping_method: ShippingOption['id']
  shipping_label: string
  shipping_eta: string
  payment_method: PaymentMethod
  installments: number
  subtotal: number
  coupon_code: string | null
  coupon_discount: number
  payment_discount: number
  shipping_cost: number
  total: number
  created_at: string
  items?: OrderItem[]
}

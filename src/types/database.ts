// Tipos do schema `public`.
// Fonte de verdade: supabase/migrations/*.sql
// Nota: o `supabase gen types` remoto exige login na CLI. Este ficheiro foi escrito
// a mao para espelhar o schema aplicado; quando houver token da CLI, corre:
//   pnpm supabase gen types typescript --project-id xyeskykcvubxsdhzxmqn --schema public > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProductType = "profile" | "fx" | "design" | "digital";
export type OrderStatus = "pending_payment" | "confirmed" | "delivered" | "cancelled";
export type PaymentMethod = "transfer" | "cash";
export type ProofStatus = "pending" | "accepted" | "rejected";
export type InventoryStatus = "available" | "assigned" | "expired" | "revoked";

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type ProductRow = {
  id: string;
  type: ProductType;
  slug: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  currency: string;
  config: Json;
  active: boolean;
  sort: number;
  created_at: string;
  updated_at: string;
};

export type FxRateRow = {
  id: string;
  base: string;
  quote: string;
  buy: number;
  sell: number;
  source: string;
  active: boolean;
  updated_at: string;
};

export type InventoryItemRow = {
  id: string;
  product_id: string;
  label: string;
  secret_ciphertext: string;
  status: InventoryStatus;
  order_item_id: string | null;
  assigned_at: string | null;
  expires_at: string | null;
  warranty_until: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerRow = {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  created_at: string;
};

export type OrderRow = {
  id: string;
  code: string;
  customer_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  delivery_fee: number;
  total: number;
  currency: string;
  payload: Json;
  internal_notes: string | null;
  confirmed_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  description: string;
  qty: number;
  unit_price: number;
  total: number;
  payload: Json;
  warranty_until: string | null;
  created_at: string;
};

export type PaymentProofRow = {
  id: string;
  order_id: string;
  file_path: string;
  mime: string | null;
  size_bytes: number | null;
  status: ProofStatus;
  note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type OrderEventRow = {
  id: number;
  order_id: string;
  actor: string;
  event: string;
  meta: Json;
  created_at: string;
};

export type OutboxRow = {
  id: number;
  order_id: string | null;
  event: string;
  channel: string;
  payload: Json;
  sent_at: string | null;
  attempts: number;
  last_error: string | null;
  created_at: string;
};

export type SettingRow = {
  key: string;
  value: Json;
  is_public: boolean;
  updated_at: string;
};

export type AdminRow = {
  email: string;
  name: string | null;
  created_at: string;
};

export type CatalogRow = Pick<
  ProductRow,
  | "id"
  | "type"
  | "slug"
  | "name"
  | "description"
  | "price"
  | "compare_at_price"
  | "currency"
  | "config"
  | "sort"
  | "created_at"
>;

export type ProductViewRow = {
  product_id: string;
  viewed_on: string;
  views: number;
};

export type Database = {
  public: {
    Tables: {
      products: Table<ProductRow>;
      fx_rates: Table<FxRateRow>;
      inventory_items: Table<InventoryItemRow>;
      customers: Table<CustomerRow>;
      orders: Table<OrderRow>;
      order_items: Table<OrderItemRow>;
      payment_proofs: Table<PaymentProofRow>;
      order_events: Table<OrderEventRow>;
      outbox: Table<OutboxRow>;
      settings: Table<SettingRow>;
      admins: Table<AdminRow>;
      rate_limits: Table<{ id: string; hits: number; window_start: string }>;
      product_views: Table<ProductViewRow>;
    };
    Views: {
      catalog: { Row: CatalogRow; Relationships: [] };
    };
    Functions: {
      top_product_id: { Args: { p_days?: number }; Returns: string | null };
      register_product_view: { Args: { p_product_id: string }; Returns: undefined };
    };
    Enums: {
      product_type: ProductType;
      order_status: OrderStatus;
      payment_method: PaymentMethod;
      proof_status: ProofStatus;
      inventory_status: InventoryStatus;
    };
    CompositeTypes: { [key: string]: never };
  };
};

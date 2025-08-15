export type OfferStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'EXPIRED';

export interface PriceListItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  company_id: string;
  created_by: string;
  created_at: string;
}

export interface Offer {
  id: string;
  client_id: string;
  net_total: number;
  status: OfferStatus;
  accepted_at: string | null;
  token: string | null;
  company_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  clients?: {
    id: string;
    name: string;
    email: string;
    company_name: string;
  };
  offer_items?: OfferItem[];
}

export interface OfferItem {
  id: string;
  offer_id: string;
  price_list_item_id: string | null;
  name: string;
  description: string | null;
  qty: number;
  price: number;
  line_total: number;
}

export interface Checklist {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  company_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOfferData {
  clientId: string;
  items: Array<{
    itemId: string;
    qty: number;
  }>;
}

export interface OfferWizardStep {
  step: number;
  title: string;
  isComplete: boolean;
  isActive: boolean;
}
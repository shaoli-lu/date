-- ==============================================================================
-- INTRAFAMILY LOAN & MORTGAGE DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Using integer cents and basis points for precise financial calculations
-- ==============================================================================

-- 1. Create loans table
create table if not exists public.loans (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null default 'Family Home Loan',
  borrower_name text not null,
  lender_name text not null,
  property_address text,

  original_principal_cents bigint not null,      -- e.g. 44000000 = $440,000
  annual_rate_bps integer not null,             -- e.g. 512 = 5.12%
  term_months integer not null default 360,
  funding_date date not null,
  first_payment_date date not null,
  payment_frequency text not null default 'monthly',

  scheduled_payment_cents bigint not null,
  payment_due_day integer not null default 1,
  grace_days integer not null default 15,
  prepayment_penalty boolean not null default false,

  payment_application text not null default 'interest_then_principal',
  status text not null default 'active',        -- draft, active, paid_off, forgiven
  note_reference text,

  -- Edge case fields
  forgiven_date date,
  forgiven_doc_reference text,
  forgiven_reason text,
  refinance_new_loan_id text,
  amendments jsonb default '[]'::jsonb,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create loan payments table
create table if not exists public.loan_payments (
  id text primary key,
  loan_id text references public.loans(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  payment_number integer,
  due_date date not null,
  paid_date date,

  scheduled_payment_cents bigint not null,
  payment_received_cents bigint not null,

  interest_cents bigint not null default 0,
  scheduled_principal_cents bigint not null default 0,
  extra_principal_cents bigint not null default 0,
  late_fee_cents bigint not null default 0,
  unpaid_interest_cents bigint not null default 0,

  balance_before_cents bigint not null,
  balance_after_cents bigint not null,

  status text not null default 'paid',          -- upcoming, partial, paid, late
  memo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table public.loans enable row level security;
alter table public.loan_payments enable row level security;

-- 4. RLS Policies
create policy "Users can manage their own loans"
  on public.loans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own loan payments"
  on public.loan_payments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

# 🩸 Blood Donation System - Database Schema Documentation

## Overview
Complete blood donation system with donor/accepter management, chat functionality, and hospital blood inventory management.

---

## 📊 Database Tables

### 1. **blood_donors** - Blood Donor Profiles
Users who want to donate blood.

**Key Fields:**
- `user_id` - Links to profiles table
- `blood_group` - A+, A-, B+, B-, AB+, AB-, O+, O-
- `is_available` - Can donate right now
- `last_donation_date` - When they last donated
- `next_available_date` - When they can donate again (90 days gap)
- `donation_count` - Total donations
- `location_lat/lng` - For finding nearby donors
- `health_declaration` - User confirms they're healthy
- `verified` - Admin/system verification

**Purpose:** Store donor information and availability.

---

### 2. **blood_requests** - General Blood Requests
Requests from users or hospitals who need blood.

**Key Fields:**
- `requester_id` - User requesting blood
- `requester_type` - 'user' or 'hospital'
- `hospital_id` - If hospital is requesting
- `blood_group` - Required blood type
- `units_required` - How many units needed
- `units_received` - How many received so far
- `urgency_level` - normal/urgent/critical
- `status` - active/partially_fulfilled/fulfilled/cancelled/expired
- `expiry_date` - When request expires

**Purpose:** Users and hospitals can request blood.

---

### 3. **blood_donations** - Track Actual Donations
Records of actual blood donations.

**Key Fields:**
- `donor_id` - Who donated
- `request_id` - Optional: if for specific request
- `blood_group` - Blood type donated
- `units_donated` - Number of units
- `donation_date` - When donated
- `donation_location` - Where donated
- `verified_by` - Hospital that verified

**Purpose:** Track donation history.

---

### 4. **blood_chat** - Chat/Messages System
Communication between donors and requesters.

**Key Fields:**
- `request_id` - Which blood request this chat is for
- `sender_id` - Who sent message
- `receiver_id` - Who receives message
- `message` - Message content
- `is_read` - Read status
- `created_at` - Timestamp

**Purpose:** Enable chat between users for coordination.

---

### 5. **hospital_blood_inventory** - Hospital Blood Stock
Track blood available at hospitals.

**Key Fields:**
- `hospital_id` - Which hospital
- `blood_group` - Blood type
- `units_available` - Current stock
- `units_reserved` - Reserved units
- `expiry_dates` - JSONB with expiry dates for each unit
- `last_updated` - When last updated

**Purpose:** Hospital blood inventory management.

**Unique Constraint:** One row per hospital per blood group.

---

### 6. **hospital_blood_requests** - Hospital-Specific Requests
Hospitals requesting specific blood types.

**Key Fields:**
- `hospital_id` - Which hospital
- `blood_group` - Required blood type
- `units_required` - Units needed
- `urgency_level` - normal/urgent/critical
- `patient_name` - Patient info
- `department` - ICU, Emergency, Surgery, etc.
- `doctor_name` - Doctor details
- `priority` - 1-10 (1 = highest)
- `status` - active/partially_fulfilled/fulfilled/cancelled

**Purpose:** Hospital-specific blood requests with medical context.

---

### 7. **blood_donor_requests** - Link Donors to Requests
Connects donors with specific requests.

**Key Fields:**
- `request_id` - Which request
- `donor_id` - Which donor
- `status` - pending/accepted/rejected/completed/cancelled
- `donor_response_at` - When donor responded
- `completed_at` - When completed

**Purpose:** Track which donors are matched with which requests.

**Unique Constraint:** One link per request-donor pair.

---

## 🔗 Relationships

```
profiles (user)
  ├── blood_donors (if user is donor)
  │   └── blood_donations (donation history)
  │       └── blood_donor_requests (linked to requests)
  │
  └── blood_requests (if user needs blood)
      ├── blood_chat (messages about request)
      └── blood_donor_requests (linked donors)

hospital_profiles
  ├── blood_requests (hospital requests)
  ├── hospital_blood_inventory (blood stock)
  ├── hospital_blood_requests (specific requests)
  └── blood_donations.verified_by (verification)
```

---

## 🔐 Row Level Security (RLS) Policies

### Blood Donors
- ✅ Users can view all **available** donors (public visibility)
- ✅ Users can manage their own donor profile
- ✅ Users can view their own profile even if not available

### Blood Requests
- ✅ Users can view all **active** requests
- ✅ Users can create/update/delete their own requests
- ✅ Hospitals can manage their own requests

### Blood Donations
- ✅ Users can view their own donation history
- ✅ Users can create donations for themselves

### Blood Chat
- ✅ Users can view messages where they are sender/receiver
- ✅ Users can send messages
- ✅ Only receiver can mark messages as read

### Hospital Inventory
- ✅ **Public view** - Anyone can see hospital blood inventory
- ✅ Hospitals can manage their own inventory

### Hospital Blood Requests
- ✅ Users can view all active hospital requests
- ✅ Hospitals can manage their own requests

### Donor-Request Links
- ✅ Users can view links related to their requests/donor profile
- ✅ Users can update status when responding

---

## ⚙️ Automatic Features (Triggers)

### 1. **Updated At Timestamps**
- All tables auto-update `updated_at` on row changes

### 2. **Donor Availability Update**
When a donation is recorded:
- ✅ Updates donor's `donation_count`
- ✅ Sets `last_donation_date`
- ✅ Calculates `next_available_date` (+90 days)
- ✅ Updates request status if linked

### 3. **Request Status Auto-Update**
- When donations are linked to requests:
  - Auto-calculates `units_received`
  - Updates status: `active` → `partially_fulfilled` → `fulfilled`
  - Sets `fulfilled_at` when complete

### 4. **Request Expiry** (Manual/Cron)
Function `expire_old_blood_requests()`:
- Expires requests past their `expiry_date`
- Should be called periodically via cron

---

## 📋 User Dashboard Integration

### For Donors:
1. **Register as Donor**
   - Create entry in `blood_donors` table
   - Set blood group, location, availability

2. **View Available Requests**
   - Query `blood_requests` where status = 'active'
   - Filter by blood group compatibility
   - See urgency and location

3. **Respond to Request**
   - Create entry in `blood_donor_requests` with status = 'pending'
   - Start chat via `blood_chat` table

4. **Donation History**
   - View `blood_donations` linked to their `donor_id`
   - See donation count and next available date

### For Accepters (Users needing blood):
1. **Create Blood Request**
   - Insert into `blood_requests` table
   - Set urgency, units needed, location

2. **View Matching Donors**
   - Query `blood_donors` where:
     - `blood_group` matches
     - `is_available` = true
     - `next_available_date` <= today

3. **Chat with Donors**
   - Use `blood_chat` table
   - Messages linked via `request_id`

4. **Track Request Status**
   - Monitor `units_received` vs `units_required`
   - See status updates

---

## 🏥 Hospital Dashboard Integration

### Blood Inventory Management:
1. **Add Blood to Inventory**
   - Update `hospital_blood_inventory`
   - Increment `units_available`
   - Store expiry dates in JSONB

2. **View Inventory**
   - Query by `hospital_id`
   - Group by `blood_group`
   - Check `units_available` and `units_reserved`

3. **Create Blood Request**
   - Insert into `hospital_blood_requests`
   - Set priority, urgency, patient details

4. **View All Requests**
   - See both:
     - `hospital_blood_requests` (hospital-specific)
     - `blood_requests` where `requester_type` = 'hospital'

5. **Verify Donations**
   - Update `blood_donations.verified_by`
   - Update inventory when donation verified

---

## 💬 Chat System Flow

1. **User creates blood request** → `blood_requests` entry
2. **Donor finds request** → Views active requests
3. **Donor responds** → Creates `blood_donor_requests` entry
4. **Chat starts** → Messages in `blood_chat`:
   - `request_id` links to blood request
   - `sender_id` and `receiver_id` for participants
5. **Messages exchange** → Via `blood_chat` table
6. **Read receipts** → `is_read` flag updates

---

## 🎯 Key Features Enabled

### 1. **Donor-Accepter Matching**
- Find compatible donors by blood group
- Filter by availability and location
- Match urgency with donor readiness

### 2. **Chat Communication**
- Real-time messaging between users
- Request-specific conversations
- Read receipts

### 3. **Hospital Blood Management**
- Track inventory per blood type
- Manage requests with medical context
- Reserve units for patients

### 4. **Donation Tracking**
- Complete donation history
- Auto-calculate next donation date
- Verify donations

### 5. **Request Management**
- Multiple request types (user/hospital)
- Urgency levels
- Auto-status updates
- Expiry handling

---

## 🚀 Next Steps for Implementation

### 1. **User Dashboard - Blood Donor Section**
- Register as donor form
- View available requests
- Respond to requests
- Chat interface
- Donation history

### 2. **User Dashboard - Blood Requester Section**
- Create blood request form
- View matching donors
- Chat with donors
- Track request status

### 3. **Hospital Dashboard - Blood Management**
- Inventory management UI
- Create blood requests
- View all hospital requests
- Verify donations

### 4. **Components Needed**
- `BloodDonorRegistration.tsx`
- `BloodRequestForm.tsx`
- `BloodDonorList.tsx`
- `BloodRequestList.tsx`
- `BloodChat.tsx`
- `HospitalBloodInventory.tsx`
- `HospitalBloodRequests.tsx`

---

## 📝 Notes

1. **Blood Group Compatibility:**
   - Should be handled in application logic
   - O- can donate to all
   - AB+ can receive from all
   - etc.

2. **Location Matching:**
   - Use `location_lat/lng` for distance calculation
   - Show nearby donors/requests

3. **Privacy:**
   - Donors can choose visibility
   - Use `is_available` flag
   - Location can be approximate

4. **Notifications:**
   - Send notifications when:
     - New matching request appears
     - Donor responds to request
     - New message in chat
     - Request status changes

5. **Expiry Management:**
   - Set `expiry_date` when creating requests
   - Run `expire_old_blood_requests()` function periodically
   - Auto-update status to 'expired'

---

**Schema is complete and ready for implementation!** 🎉


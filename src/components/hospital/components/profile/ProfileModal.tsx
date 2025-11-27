import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string;
}

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: Profile | null;
  onProfileUpdate: (updated: Partial<Profile>) => Promise<void>;
}

export const ProfileModal = ({ open, onClose, profile, onProfileUpdate }: ProfileModalProps) => {
  const [form, setForm] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    phone: profile?.phone || "",
    email: profile?.email || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      phone: profile?.phone || "",
      email: profile?.email || "",
    });
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    await onProfileUpdate(form);
    setSaving(false);
    onClose();
  };

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md shadow-lg">
        <h2 className="text-lg font-bold mb-4">Update Profile</h2>
        <div className="space-y-3">
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            name="first_name"
            placeholder="First Name"
            value={form.first_name}
            onChange={handleChange}
          />
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            name="last_name"
            placeholder="Last Name"
            value={form.last_name}
            onChange={handleChange}
          />
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
          />
          <input
            className="w-full border rounded px-3 py-2 text-sm bg-gray-100"
            name="email"
            placeholder="Email"
            value={form.email}
            disabled
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { Users, X } from 'lucide-react';
import { Relationship, MemoryParticipant } from '../../types';

interface PartnerSelectorProps {
  relationships: Relationship[];
  selectedPartners: string[];
  onPartnersChange: (partnerIds: string[]) => void;
  disabled?: boolean;
}

export function PartnerSelector({ 
  relationships, 
  selectedPartners, 
  onPartnersChange, 
  disabled = false 
}: PartnerSelectorProps) {
  const togglePartner = (partnerId: string) => {
    if (disabled) return;
    
    if (selectedPartners.includes(partnerId)) {
      onPartnersChange(selectedPartners.filter(id => id !== partnerId));
    } else {
      onPartnersChange([...selectedPartners, partnerId]);
    }
  };

  const removePartner = (partnerId: string) => {
    if (disabled) return;
    onPartnersChange(selectedPartners.filter(id => id !== partnerId));
  };

  if (relationships.length === 0) {
    return (
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center space-x-2 text-gray-400 mb-2">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">Tag Partners</span>
        </div>
        <p className="text-sm text-gray-500">
          Connect with partners in your profile to tag them in memories.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-3">
        <Users className="inline h-4 w-4 mr-1" />
        Tag Partners
      </label>
      
      {/* Selected Partners */}
      {selectedPartners.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedPartners.map(partnerId => {
            const partner = relationships.find(r => r.partner_id === partnerId);
            return (
              <div
                key={partnerId}
                className="flex items-center space-x-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm"
              >
                <span>{partner?.partner_name || 'Unknown'}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removePartner(partnerId)}
                    className="hover:text-purple-100 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Available Partners */}
      <div className="space-y-2">
        {relationships.map(relationship => (
          <label
            key={relationship.id}
            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
              selectedPartners.includes(relationship.partner_id!)
                ? 'bg-purple-500/20 border-purple-500/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedPartners.includes(relationship.partner_id!)}
              onChange={() => togglePartner(relationship.partner_id!)}
              disabled={disabled}
              className="sr-only"
            />
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-purple-300">
                {relationship.partner_name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{relationship.partner_name}</p>
              <p className="text-xs text-gray-400 capitalize">
                {relationship.relationship_type}
                {relationship.is_primary && ' • Primary'}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
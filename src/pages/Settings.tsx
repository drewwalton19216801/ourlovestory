import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Lock, Users, Eye, User, UserPlus, Trash2 } from 'lucide-react';
import { ProfileSettings } from '../components/Settings/ProfileSettings';
import { PrivacySettings } from '../components/Settings/PrivacySettings';
import { PasswordSettings } from '../components/Settings/PasswordSettings';
import { RelationshipSettings } from '../components/Settings/RelationshipSettings';
import { InviteFriends } from '../components/Settings/InviteFriends';
import { AccountDeletionSettings } from '../components/Settings/AccountDeletionSettings';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'password' | 'relationships' | 'invite' | 'delete'>('profile');

  const tabs = [
    {
      id: 'profile' as const,
      label: 'Profile',
      shortLabel: 'Profile',
      icon: User,
      description: 'Update your display name and bio'
    },
    {
      id: 'privacy' as const,
      label: 'Privacy',
      shortLabel: 'Privacy',
      icon: Eye,
      description: 'Manage your privacy preferences'
    },
    {
      id: 'password' as const,
      label: 'Password',
      shortLabel: 'Password',
      icon: Lock,
      description: 'Update your account password'
    },
    {
      id: 'relationships' as const,
      label: 'Relationships',
      shortLabel: 'Connect',
      icon: Users,
      description: 'Connect with partners and friends'
    },
    {
      id: 'invite' as const,
      label: 'Invite Friends',
      shortLabel: 'Invite',
      icon: UserPlus,
      description: 'Invite friends and family to join'
    },
    {
      id: 'delete' as const,
      label: 'Delete Account',
      shortLabel: 'Delete',
      icon: Trash2,
      description: 'Permanently delete your account'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-white/10">
          <div className="flex items-center space-x-3 mb-2">
            <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">
            Manage your account preferences and privacy settings
          </p>
        </div>

        {/* Mobile Navigation (Horizontal Tabs) */}
        <div className="lg:hidden border-b border-white/10">
          <div className="flex w-full overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex flex-col items-center px-3 py-3 transition-all min-w-[80px] ${
                    activeTab === tab.id
                      ? 'text-purple-300 bg-purple-500/20 border-b-2 border-purple-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  } ${tab.id === 'delete' ? 'text-red-400 hover:text-red-300' : ''}`}
                >
                  <Icon className="h-4 w-4 mb-1" />
                  <span className="text-xs font-medium text-center leading-tight">
                    {tab.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-1/3 xl:w-1/4 p-6 border-r border-white/10">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? tab.id === 'delete'
                          ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                          : 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
                        : tab.id === 'delete'
                          ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300'
                          : 'hover:bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-1">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </div>
                    <p className="text-sm opacity-75">{tab.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-6">
            {/* Mobile Tab Description */}
            <div className="lg:hidden mb-4">
              <div className={`rounded-lg p-3 border ${
                activeTab === 'delete' 
                  ? 'bg-red-500/10 border-red-500/20' 
                  : 'bg-white/5 border-white/10'
              }`}>
                <div className="flex items-center space-x-2">
                  {React.createElement(tabs.find(tab => tab.id === activeTab)?.icon || User, {
                    className: `h-4 w-4 ${activeTab === 'delete' ? 'text-red-400' : 'text-purple-400'}`
                  })}
                  <span className={`text-sm ${
                    activeTab === 'delete' ? 'text-red-300' : 'text-gray-300'
                  }`}>
                    {tabs.find(tab => tab.id === activeTab)?.description}
                  </span>
                </div>
              </div>
            </div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="min-h-0" // Prevent content from being pushed down
            >
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'privacy' && <PrivacySettings />}
              {activeTab === 'password' && <PasswordSettings />}
              {activeTab === 'relationships' && <RelationshipSettings />}
              {activeTab === 'invite' && <InviteFriends />}
              {activeTab === 'delete' && <AccountDeletionSettings />}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
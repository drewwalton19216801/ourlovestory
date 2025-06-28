import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Lock, Users, Eye, User } from 'lucide-react';
import { ProfileSettings } from '../components/Settings/ProfileSettings';
import { PrivacySettings } from '../components/Settings/PrivacySettings';
import { PasswordSettings } from '../components/Settings/PasswordSettings';
import { RelationshipSettings } from '../components/Settings/RelationshipSettings';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'password' | 'relationships'>('profile');

  const tabs = [
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: User,
      description: 'Update your display name and bio'
    },
    {
      id: 'privacy' as const,
      label: 'Privacy',
      icon: Eye,
      description: 'Manage your privacy preferences'
    },
    {
      id: 'password' as const,
      label: 'Password',
      icon: Lock,
      description: 'Update your account password'
    },
    {
      id: 'relationships' as const,
      label: 'Relationships',
      icon: Users,
      description: 'Connect with partners and friends'
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
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center space-x-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Settings</h1>
          </div>
          <p className="text-gray-400">
            Manage your account preferences and privacy settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <div className="lg:w-1/3 xl:w-1/4 p-6 border-b lg:border-b-0 lg:border-r border-white/10">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
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
          <div className="flex-1 p-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'privacy' && <PrivacySettings />}
              {activeTab === 'password' && <PasswordSettings />}
              {activeTab === 'relationships' && <RelationshipSettings />}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
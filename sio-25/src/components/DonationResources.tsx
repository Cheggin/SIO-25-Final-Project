import { useState } from 'react';
import { Heart, Globe, Shield, Users, Droplet, Home, AlertTriangle, ExternalLink } from 'lucide-react';
import './DonationResources.css';

interface DonationOrg {
  name: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  category: 'general' | 'medical' | 'children' | 'environment' | 'emergency';
  focus: string[];
}

export default function DonationResources() {
  const organizations: DonationOrg[] = [
    {
      name: 'International Red Cross',
      description: 'Provides emergency assistance, disaster relief, and disaster preparedness education worldwide.',
      url: 'https://www.icrc.org/en/donate',
      icon: <Heart className="org-icon" />,
      category: 'general',
      focus: ['Emergency Response', 'Medical Aid', 'Disaster Relief']
    },
    {
      name: 'UNICEF',
      description: 'Focuses on providing humanitarian aid to children and mothers in developing countries affected by disasters.',
      url: 'https://www.unicef.org/emergencies',
      icon: <Users className="org-icon" />,
      category: 'children',
      focus: ['Child Protection', 'Education', 'Emergency Aid']
    },
    {
      name: 'Doctors Without Borders',
      description: 'Delivers emergency medical aid to people affected by conflict, epidemics, disasters, or exclusion from healthcare.',
      url: 'https://give.doctorswithoutborders.org/campaign/675296/donate?_gl=1*1ov69yj*_gcl_au*Mjc3MjE4NDkzLjE3NTcwMjE4MDU.*_ga*NTYwMDgxOTE1LjE3NTcwMjE4MDU.*_ga_C7EW6Q0J9K*czE3NTcwMjE4MDUkbzEkZzEkdDE3NTcwMjE4MTIkajUzJGwwJGgw',
      icon: <Shield className="org-icon" />,
      category: 'medical',
      focus: ['Medical Emergency', 'Healthcare', 'Disease Outbreaks']
    },
    {
      name: 'Direct Relief',
      description: 'Provides medical resources to communities affected by poverty and emergencies worldwide.',
      url: 'https://www.directrelief.org/emergency/',
      icon: <Shield className="org-icon" />,
      category: 'medical',
      focus: ['Medical Supplies', 'Emergency Medicine', 'Health Infrastructure']
    },
    {
      name: 'World Food Programme',
      description: 'The world\'s largest humanitarian organization addressing hunger and promoting food security in disaster zones.',
      url: 'https://www.wfp.org/support-us/stories/emergencies',
      icon: <Home className="org-icon" />,
      category: 'general',
      focus: ['Food Security', 'Nutrition', 'Emergency Food Aid']
    },
    {
      name: 'GlobalGiving',
      description: 'Connects nonprofits, donors, and companies for disaster relief efforts worldwide.',
      url: 'https://www.globalgiving.org/disasters/',
      icon: <Globe className="org-icon" />,
      category: 'general',
      focus: ['Disaster Relief', 'Community Recovery', 'Local Organizations']
    },
    {
      name: 'Save the Children',
      description: 'Provides emergency relief to children and families affected by natural disasters and conflicts.',
      url: 'https://www.savethechildren.org/us/what-we-do/emergency-response',
      icon: <Users className="org-icon" />,
      category: 'children',
      focus: ['Child Protection', 'Emergency Education', 'Family Support']
    },
    {
      name: 'Water.org',
      description: 'Provides access to safe water and sanitation in areas affected by water crises and disasters.',
      url: 'https://water.org/donate/',
      icon: <Droplet className="org-icon" />,
      category: 'environment',
      focus: ['Clean Water', 'Sanitation', 'Water Crisis Response']
    },
    {
      name: 'All Hands and Hearts',
      description: 'Addresses immediate and long-term needs of communities impacted by natural disasters.',
      url: 'https://www.allhandsandhearts.org/donate/',
      icon: <Heart className="org-icon" />,
      category: 'general',
      focus: ['Rebuilding', 'Volunteer Coordination', 'Community Recovery']
    },
    {
      name: 'Team Rubicon',
      description: 'Unites military veterans with first responders to rapidly deploy emergency response teams.',
      url: 'https://support.teamrubiconusa.org/supportmgmt/donation/tr-25-web?utm_source=mainwebsite&utm_medium=navigation&utm_campaign=2025-GeneralDonations',
      icon: <Shield className="org-icon" />,
      category: 'emergency',
      focus: ['Rapid Response', 'Veteran Volunteers', 'Disaster Recovery']
    },
    {
      name: 'Habitat for Humanity',
      description: 'Helps families recover from natural disasters by rebuilding homes and communities.',
      url: 'https://secure.habitat.org/site/Donation2?df_id=7753&mfc_pref=T&7753.donation=form1&keyword=button-header-single',
      icon: <Home className="org-icon" />,
      category: 'general',
      focus: ['Housing', 'Rebuilding', 'Community Development']
    },
    {
      name: 'Conservation International',
      description: 'Works on climate change mitigation and helping communities adapt to environmental disasters.',
      url: 'https://www.conservation.org/act/donate?form=FUNSEMVWAJH&_ga=2.62747500.1372807668.1757021882-110891004.1757021882',
      icon: <Globe className="org-icon" />,
      category: 'environment',
      focus: ['Climate Action', 'Environmental Protection', 'Community Resilience']
    }
  ];

  const categories = [
    { id: 'all', label: 'All Organizations', icon: <Globe /> },
    { id: 'general', label: 'General Relief', icon: <Heart /> },
    { id: 'medical', label: 'Medical Aid', icon: <Shield /> },
    { id: 'children', label: 'Children & Families', icon: <Users /> },
    { id: 'environment', label: 'Environmental', icon: <Droplet /> },
    { id: 'emergency', label: 'Emergency Response', icon: <AlertTriangle /> }
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredOrgs = selectedCategory === 'all' 
    ? organizations 
    : organizations.filter(org => org.category === selectedCategory);

  return (
    <div className="donation-resources">
      <div className="resources-header">
        <div className="header-content">
          <Heart className="header-icon" />
          <div>
            <h2>Disaster Relief Organizations</h2>
            <p className="subtitle">Support trusted organizations providing emergency aid and disaster relief worldwide</p>
          </div>
        </div>

        <div className="impact-banner">
          <div className="impact-item">
            <AlertTriangle className="impact-icon" />
            <div className="impact-content">
              <span className="impact-label">Your donation can provide</span>
              <span className="impact-value">Emergency shelter, clean water, medical care, and hope</span>
            </div>
          </div>
        </div>
      </div>

      <div className="category-filters">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="organizations-grid">
        {filteredOrgs.map(org => (
          <div key={org.name} className="org-card">
            <div className="org-header">
              {org.icon}
              <h3>{org.name}</h3>
            </div>
            
            <p className="org-description">{org.description}</p>
            
            <div className="org-focus">
              {org.focus.map(item => (
                <span key={item} className="focus-tag">{item}</span>
              ))}
            </div>

            <a 
              href={org.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="donate-btn"
            >
              <span>Donate Now</span>
              <ExternalLink size={16} />
            </a>
          </div>
        ))}
      </div>

      <div className="disclaimer">
        <AlertTriangle size={16} />
        <p>
          These are well-established international relief organizations. Always verify organizations before donating 
          and consider researching local organizations that may have direct impact in specific disaster areas.
        </p>
      </div>
    </div>
  );
}
export const mockProfile = {
  personal: {
    name: 'Alex Morgan',
    email: 'alex.morgan@email.com',
    location: 'Budapest, Hungary',
  },
  career: {
    targetRoles: 'Product Designer, UX Designer',
    workType: 'Remote, Hybrid',
    seniority: 'Mid\u2013level',
  },
  experienceEducation: [
    {
      id: 'exp-1',
      title: 'Product Designer at Acme Studio',
      period: '2019\u20132024',
      role: 'Product Designer',
      organization: 'Acme Studio',
    },
    {
      id: 'edu-1',
      title: 'MSc Interaction Design at MOME',
      period: '2021',
      role: 'MSc Interaction Design',
      organization: 'MOME',
    },
  ],
  skills: [
    'Figma',
    'User research',
    'Design systems',
    'Prototyping',
  ],
  languages: [
    { id: 'lang-1', language: 'English', level: 'C1' },
    { id: 'lang-2', language: 'Hungarian', level: 'B2' },
    { id: 'lang-3', language: 'Spanish', level: 'A2' },
  ],
};

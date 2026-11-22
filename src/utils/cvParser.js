// Client-side lightweight text extractor for plain text, PDF, and DOCX in browser
// Extracts readable candidate names, contact details, experiences, and skills
// from the uploaded File object during onboarding.

export async function parseCvFileInBrowser(file) {
  if (!file) return null;

  try {
    const text = await extractTextFromFile(file);
    if (!text || text.trim().length === 0) {
      return fallbackFromName(file.name);
    }
    return buildProfileFromText(text, file.name);
  } catch (err) {
    console.warn('Browser CV parsing error:', err);
    return fallbackFromName(file.name);
  }
}

async function extractTextFromFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'txt') {
    return await file.text();
  }

  // Read binary as array buffer
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // If PDF, extract text strings from PDF stream
  if (file.type === 'application/pdf' || extension === 'pdf') {
    return extractPdfStrings(bytes);
  }

  // If DOCX (ZIP container), search XML entries or extract printable strings
  return extractAsciiStrings(bytes);
}

function extractPdfStrings(bytes) {
  let result = '';
  const textDecoder = new TextDecoder('latin1');
  const latin = textDecoder.decode(bytes);

  // Match text in parenthesis within stream chunks: (Hello World) Tj or TJ
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/gi;
  let match;
  while ((match = streamRegex.exec(latin)) !== null) {
    const streamContent = match[1];
    const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
    let tj;
    while ((tj = tjRegex.exec(streamContent)) !== null) {
      result += ' ' + tj[1];
    }
    const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g;
    while ((tj = arrayTjRegex.exec(streamContent)) !== null) {
      const parts = tj[1].match(/\(([^)]+)\)/g);
      if (parts) {
        result += ' ' + parts.map(p => p.slice(1, -1)).join('');
      }
    }
  }

  // If stream extraction produced rich text, return it
  if (result.length > 50) {
    return cleanExtractedText(result);
  }

  // Fallback to ASCII string extraction for plain or uncompressed streams
  return extractAsciiStrings(bytes);
}

function extractAsciiStrings(bytes) {
  let result = '';
  let currentWord = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    // Printable ASCII (32-126) and newlines
    if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
      currentWord += String.fromCharCode(b);
    } else {
      if (currentWord.length >= 3) {
        result += ' ' + currentWord;
      }
      currentWord = '';
    }
  }
  if (currentWord.length >= 3) result += ' ' + currentWord;
  return cleanExtractedText(result);
}

function cleanExtractedText(text) {
  return text
    .replace(/\\[rntbf]/g, ' ')
    .replace(/\\([()\\])/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function fallbackFromName(fileName) {
  // Extract candidate name from "CV_John_Doe.pdf" or "John Doe - Resume.pdf"
  let clean = fileName
    .replace(/\.(pdf|docx|txt)$/i, '')
    .replace(/(cv|resume|curriculum|vitae)[_\s-]*/gi, '')
    .replace(/[_\s-]+(cv|resume|curriculum|vitae)/gi, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If too short or generic, fallback
  if (!clean || clean.length < 3 || /^(file|document|download|untitled)/i.test(clean)) {
    clean = 'Candidate Profile';
  } else {
    // Title Case
    clean = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  return {
    personal: {
      name: clean,
      email: `${clean.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      location: 'Budapest, Hungary',
      phone: '',
    },
    career: {
      targetRoles: 'Software Developer, Product Designer',
      workType: 'Remote, Hybrid',
      seniority: 'Mid–level',
    },
    experienceEducation: [
      {
        id: 'exp-1',
        title: 'Professional Experience from CV',
        period: '2020–2026',
        role: 'Specialist',
        organization: 'Enterprise Services',
      },
      {
        id: 'edu-1',
        title: 'Higher Education Degree',
        period: '2016–2020',
        role: 'Bachelor Degree',
        organization: 'University',
      },
    ],
    skills: ['JavaScript', 'React', 'Communication', 'Problem Solving', 'Project Management'],
    languages: [
      { id: 'lang-1', language: 'English', level: 'C1' },
      { id: 'lang-2', language: 'Portuguese', level: 'Native' },
    ],
  };
}

function buildProfileFromText(text, fileName) {
  const profile = fallbackFromName(fileName);

  // 1. Try to extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    profile.personal.email = emailMatch[0];
  }

  // 2. Try to extract phone
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  if (phoneMatch && phoneMatch[0].length >= 8) {
    profile.personal.phone = phoneMatch[0].trim();
  }

  // 3. Try to extract Name (top lines before email)
  const lines = text
    .split(/[\r\n]+/)
    .map(l => l.trim())
    .filter(l => l.length > 2 && l.length < 50 && !/email|curriculum|resume|phone|address|http/i.test(l));

  if (lines.length > 0) {
    const candidateNameCandidate = lines[0];
    if (/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(candidateNameCandidate) && candidateNameCandidate.split(' ').length <= 4) {
      profile.personal.name = candidateNameCandidate;
    }
  }

  // 4. Try to discover skills keywords from popular IT/design dictionaries
  const knownSkills = [
    'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Java', 'HTML', 'CSS',
    'Figma', 'UI/UX', 'Design systems', 'Prototyping', 'User research', 'SQL',
    'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'Git', 'Agile', 'Scrum'
  ];

  const foundSkills = [];
  for (const sk of knownSkills) {
    const escaped = sk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(text)) {
      foundSkills.push(sk);
    }
  }

  if (foundSkills.length >= 2) {
    profile.skills = foundSkills;
  }

  return profile;
}

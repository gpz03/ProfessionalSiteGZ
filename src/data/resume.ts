export const person = {
  name: "Gavin Zola",
  title: "IT Graduate | System Administration",
  summary:
    "IT system administration graduate (UMass Boston, May 2026) with a track record of translating complex technology into clear, confident communication for customers, colleagues, and clients. Consistently top performing according to tracked metrics at previous positions. Experienced in onboarding and training. Technically grounded in cloud, networking, system administration, and agentic gen AI. Notable people skills and a Management minor bridging technology and business.",
  email: "GZ.IT.26@gmail.com",
  github: "https://github.com/gavinzola",
  linkedin: "https://linkedin.com/in/gavin-zola-436670329",
};

export const highlights = [
  "IT Internship at South Shore Charter Public School — device onboarding, server setup, and IT support",
  "Tech retail experience at Best Buy and Staples — translating complex tech into clear guidance",
  "Systems & cloud focus — Windows Server, Linux, networking fundamentals",
  "Hands-on automation exposure through coursework in intermediate scripting and system administration",
];

export const projects = [
  {
    id: "cloud-lab",
    title: "Azure CI/CD Pipeline",
    status: "Completed",
    overview:
      "Engineered an automated CI/CD pipeline deploying this React portfolio to Azure using GitHub Actions and Azure Static Web Apps, integrated with a live continuous deployment Guestbook that commits signatures to GitHub via the REST API.",
    goal:
      "Build hands-on CI/CD automation skills by enabling visitors to trigger, track, and verify a real deployment pipeline run in real time.",
    technologies: ["Microsoft Azure", "Azure Static Web Apps", "GitHub Actions", "GitHub REST API", "CI/CD Pipeline"],
    whatIDid: [
      "Provisioned Azure Static Web App resources via the Azure CLI",
      "Configured a GitHub Actions workflow for automated continuous integration and deployment",
      "Implemented a secure write-back API utilizing GitHub's Contents API to append visitor signatures directly to repository files",
      "Built a live pipeline tracker showing the workflow run's progress (Queued, Building, Deploying) and active logs directly from GitHub API"
    ],
    result: "Completed — Pipeline fully integrated with a secure guestbook commit deployment visualizer.",
    takeaways: [
      "Designing automated CI/CD workflows and secure Git write-back integrations",
      "Managing deployment secrets and securing API write scopes (XSS prevention and rate limiting)",
      "Implementing cost-effective (zero-cost) enterprise cloud deployment structures"
    ],
  },
  {
    id: "nas-storage",
    title: "NAS Cloud Storage System",
    status: "Completed",
    overview:
      "Configured a Network Attached Storage (NAS) file storage server integrated with the portfolio site, letting users upload, browse, download, and manage files under a 1GB quota, while providing secure, unlimited persistent storage for the administrator.",
    goal:
      "Demonstrate hands-on storage area network (SAN) and NAS concepts, API-based file management, role-based authorization, and storage quota enforcement.",
    technologies: ["Synology", "Node.js", "Azure Functions", "File APIs", "Storage Quota System", "Vanilla CSS"],
    whatIDid: [
      "Implemented a file upload/download API endpoint in Azure Functions",
      "Designed a storage quota calculation module enforcing 1GB total limits for guests",
      "Created an Owner Mode allowing password-authenticated administrative access to a separate personal directory",
      "Built a responsive NAS explorer frontend with upload/download/delete controls",
      "Added real-time capacity monitoring and validation warnings"
    ],
    result: "Completed — NAS file explorer live on the site with 1GB quota limit and Owner Mode.",
    takeaways: [
      "Handling multipart file uploads in serverless endpoints",
      "Implementing storage volume calculation and quota enforcement",
      "Building secure file explorer frontends with authorization headers",
    ],
  },
  {
    id: "automation-scripts",
    title: "PowerShell Automation Suite",
    status: "Completed",
    overview:
      "Built an interactive PowerShell Scripts repository on this portfolio, loaded with system diagnostics, network audits, and storage capacity integrity verification scripts.",
    goal:
      "Learn scripting automation with PowerShell cmdlets, handling system resource querying, monitoring filesystem quotas, and auditing security configurations.",
    technologies: ["PowerShell Core", "Azure Functions", "System Diagnostics", "Directory Audits", "Terminal Simulation"],
    whatIDid: [
      "Developed administrative diagnostics scripts querying CPU, kernel, memory, and network interfaces",
      "Created storage quota scripts measuring folder capacities and predicting quota limits",
      "Designed Domain Services validation routines identifying running services and linked GPOs",
      "Built a secure backend API allowing execution of predefined scripts while preventing arbitrary injection",
      "Designed a simulated, responsive Windows PowerShell terminal frontend with execution progress tracking"
    ],
    result: "Completed — Integrated PowerShell Console live with system diagnostic capability.",
    takeaways: [
      "Parsing and outputting structured stream objects (Success, Warning, Error, Verbose)",
      "Enforcing strict parameter whitelisting to guarantee endpoint security",
      "Building responsive interactive CLI widgets simulating terminal environments"
    ],
  },
  {
    id: "ad-homelab",
    title: "Active Directory Home Lab",
    status: "Completed",
    overview:
      "Built a bare-metal Type-1 hypervisor using Proxmox VE hosting a virtual Windows Server domain controller and Active Directory environment, equipped with a live frontend query tool to inspect system accounts and active services in real time.",
    goal:
      "Practice hands-on enterprise virtualization, Active Directory administration, and operating system audits through secure, live integrations.",
    technologies: ["Proxmox VE", "Windows Server 2022", "Active Directory", "PowerShell Cmdlets", "System Auditing"],
    whatIDid: [
      "Provisioned a bare-metal Proxmox Virtual Environment (PVE)",
      "Set up a virtualized Windows Server domain controller and configured Active Directory Domain Services (AD DS)",
      "Built an OS-level query endpoint using PowerShell child-processes to fetch active domain users, running processes, and network setups",
      "Designed a real-time frontend Directory Explorer allowing visitors to execute active audits on the hosting server",
      "Configured Group Policy Objects (GPOs) and organizational units (OUs) for system hardening"
    ],
    result: "Completed — AD DS environment fully deployed and integrated with live query tools on this portfolio.",
    takeaways: [
      "Deep familiarity with Windows Server roles, AD DS administration, and domain architecture",
      "Executing safe, read-only administrative PowerShell scripts via API endpoints",
      "Diagnosing network virtualization, DHCP, DNS, and secure directory services"
    ],
  },
  {
    id: "network-topology",
    title: "Network Topology & Security Simulator",
    status: "Completed",
    overview:
      "Designed an interactive SVG-based network topology visualizer and diagnostic simulator allowing visitors to trace packet routes, test network commands, and configure firewall sandbox rules in real time.",
    goal:
      "Demonstrate hands-on networking and security concepts including VLAN separation, ICMP ping filters, IP routing path calculations, and Intrusion Prevention Systems (IPS).",
    technologies: ["React Hooks", "SVG Animation", "Network Protocols", "Firewall Rules", "Diagnostic Tools"],
    whatIDid: [
      "Constructed an interactive network canvas using responsive SVG path animations to trace packet hops",
      "Created visual firewall node intercepts which drop/reject blocked packets dynamically",
      "Built a diagnostic command panel simulating Ping, Traceroute, HTTP GET, and TCP Port Scan queries",
      "Designed sandbox toggles enforcing ICMP blocks, VLAN 20 isolation, and active security filters",
      "Implemented a live terminal log rendering realistic console command feedback based on firewall rules"
    ],
    result: "Completed — Visual network topology playground integrated with live firewall rule verification.",
    takeaways: [
      "Translating Layer 2/3 network separation concepts into modular UI components",
      "Animating complex hardware-accelerated vector graphics paths in HTML DOM",
      "Designing responsive troubleshooting utilities mimicking enterprise diagnostics"
    ],
  },
];

export const experience = [
  {
    id: "bestbuy",
    title: "Tech Sales Associate",
    company: "Best Buy",
    location: "Boston, MA",
    dates: "Apr 2025 – Present",
    bullets: [
      "Among the store's highest performers in core metrics; ranked in the top 20 sales teams nationally.",
      "Onboarded and mentor new associates, lead informal training sessions and certifications.",
    ],
  },
  {
    id: "staples",
    title: "Customer Tech Support & Sales Associate",
    company: "Staples",
    location: "Weymouth, MA",
    dates: "Jun 2022 – Feb 2024",
    bullets: [
      "Delivered hands-on PC and mobile support (virus removal, OS installs, data transfers)",
      "Built a reputation for patience with non-technical customers; consistently guided people of all ages through understanding and using their devices.",
    ],
  },
  {
    id: "sscps",
    title: "IT Intern",
    company: "South Shore Charter Public School",
    location: "Norwell, MA",
    dates: "Jun – Aug 2023",
    bullets: [
      "Configured new server and AV infrastructure; onboarded, enrolled, and managed Chromebooks, Macs, and iPads via enterprise MDM.",
    ],
  },
];

export const skills = {
  "Cloud & DevOps": ["Microsoft Azure", "GitHub Actions", "CI/CD pipelines", "Azure Web Apps", "REST APIs"],
  "Systems & Network": ["Active Directory", "Proxmox", "Windows Server", "TCP/IP", "DNS", "DHCP", "VLANs", "STP"],
  "Scripting & Tools": ["PowerShell", "Python", "Bash", "SQL", "MDM platforms", "Git", "Antigravity", "Codex"],
  Platforms: ["Windows", "macOS", "Linux/Unix", "ChromeOS", "Android"],
};

export const education = [
  {
    institution: "University of Massachusetts Boston",
    degree: "B.S. Information Technology",
    minor: "Minor: Management",
    dates: "September 2021 – May 2026",
    notes: [],
  },
  {
    institution: "Darmstadt University of Applied Sciences",
    degree: "Study Abroad Program",
    dates: "March 2024 – August 2024",
    notes: [
      "Developed adaptability and communication skills in a new cultural and academic environment",
      "Met with the head of the Hessen House of Digital Transformation — gained insight into technology integration strategies for businesses",
    ],
  },
];

export const courses = [
  "IT Problem Solving",
  "Introduction to Networks",
  "Introduction to Linux/Unix",
  "Windows System Administration",
  "Network Security Administration",
  "System Administration",
  "Relational Databases",
  "Intermediate Scripting",
  "Social Issues and Ethics in Computing",
];

export const additionalExperience = [
  "Experience in over-the-phone technical support",
  "Familiar with support ticketing systems",
  "Regularly follow emerging technologies, industry trends, and news",
  "Deep experience utilizing various types of generative AI models, including coding and agent models",
  "Significant organizational experience, including file management",
];

export const personalProjects = [
  {
    title: "PC Refurbishment for Community Donation",
    description:
      "Refurbished decommissioned PCs with fresh OS installations and secure network configurations for donation to a community library.",
  },
  {
    title: "Home Network Support",
    description:
      "Provided local residents with home Wi-Fi setup and troubleshooting support, enhancing network performance and coverage.",
  },
];

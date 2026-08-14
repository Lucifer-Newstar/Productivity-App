"use client";

/**
 * Pre-built career roadmap templates.
 *
 * Five starter tracks — DevOps, Networking, Linux, MLOps, Cloud — each with
 * curated phases and milestones (resources, projects, labs, proficiency targets,
 * hours estimates). Phases are sequential; milestones within a phase can be
 * worked in parallel unless `dependsOn` is set.
 */

import type { CareerRoadmap } from "./careerTypes";

const uid = (() => {
  let i = 0;
  return (prefix = "tpl") => `${prefix}-${Date.now().toString(36)}-${(i++).toString(36)}`;
})();

function m(
  title: string,
  opts: Partial<{
    description: string;
    hours: number;
    proficiency: number;
    resources: { type: "course"|"book"|"video"|"docs"|"lab"|"article"|"podcast"; title: string }[];
    projects: string[];
    labs: string[];
    dependsOn: string[];
  }> = {}
) {
  const id = uid("ms");
  return {
    id,
    title,
    description: opts.description,
    hoursEstimate: opts.hours ?? 20,
    hoursActual: 0,
    targetProficiency: opts.proficiency ?? 5,
    selfRatingBefore: undefined as number | undefined,
    selfRatingAfter: undefined as number | undefined,
    resources: (opts.resources ?? []).map((r) => ({ id: uid("res"), type: r.type, title: r.title })),
    projects: (opts.projects ?? []).map((t) => ({ id: uid("prj"), title: t })),
    labChecklist: (opts.labs ?? []).map((t) => ({ id: uid("lab"), text: t, done: false })),
    quiz: [],
    notes: undefined,
    done: false,
    completedAt: undefined,
    dependsOn: opts.dependsOn,
    skillTags: [],
  };
}

function phase(title: string, milestones: ReturnType<typeof m>[], description?: string) {
  return { id: uid("ph"), title, description, milestones };
}

// ---------------- DEVOPS ----------------
const devops: CareerRoadmap = {
  id: "tpl-devops",
  name: "DevOps Engineer",
  icon: "⚙️",
  color: "#06b6d4",
  template: "devops",
  description: "Linux → containers → orchestration → CI/CD → observability → SRE practice.",
  weeklyHoursTarget: 8,
  priority: 9,
  status: "active",
  startLevel: 2,
  targetLevel: 9,
  startedAt: Date.now(),
  phases: [
    phase("I · Linux & Shell Fundamentals", [
      m("Linux filesystem, permissions, users", { hours: 15, proficiency: 6,
        resources: [{ type: "book", title: "The Linux Command Line (Shotts)" }, { type: "course", title: "Linux Survival (online)" }],
        labs: ["Create users/groups and chmod/chown a shared folder", "Navigate /proc and /sys for process/device info"] }),
      m("Bash scripting: loops, pipes, awk/sed", { hours: 25, proficiency: 7,
        resources: [{ type: "book", title: "Classic Shell Scripting" }, { type: "video", title: "Bash Academy" }],
        projects: ["Write a log-rotator script with rotation+compression", "Write a backup script using rsync + cron"] }),
      m("Networking basics: TCP/UDP, DNS, HTTP, SSH", { hours: 15, proficiency: 5,
        resources: [{ type: "course", title: "Computer Networking (Stanford CS144 free)" }, { type: "docs", title: "man: ip, ss, dig, curl, tcpdump" }],
        labs: ["Debug a slow request with curl -v and tcpdump", "Set up SSH keys + ssh-agent, disable password login"] }),
      m("Package managers & services (systemd, apt/yum/apk)", { hours: 10, proficiency: 5,
        resources: [{ type: "docs", title: "systemd man pages" }],
        labs: ["Create a systemd unit for a Node.js app with restart policy"] }),
    ], "Your foundation — comfort on any Linux box."),

    phase("II · Git, Scripting & Version Control", [
      m("Git: branching, rebasing, bisect, hooks", { hours: 12, proficiency: 7,
        resources: [{ type: "book", title: "Pro Git (free)" }],
        projects: ["Set up a pre-commit hook that lints and runs tests"] }),
      m("Python for ops (requests, click, subprocess)", { hours: 30, proficiency: 6,
        resources: [{ type: "course", title: "Automate the Boring Stuff" }, { type: "book", title: "Python for DevOps" }],
        projects: ["Build a CLI that queries AWS/GCP and prints a resource inventory"] }),
    ]),

    phase("III · Containers & Docker", [
      m("Docker: images, layers, Dockerfile best practices", { hours: 20, proficiency: 7,
        resources: [{ type: "course", title: "Docker for DevOps (KodeKloud)" }, { type: "docs", title: "docs.docker.com" }],
        projects: ["Containerize a 3-tier app (web/api/db) with multi-stage builds"] }),
      m("Compose, volumes, networking, multi-container dev", { hours: 15, proficiency: 7,
        projects: ["docker-compose.yml for a full local dev stack with hot-reload"] }),
      m("Container security: non-root, distroless, scanning", { hours: 10, proficiency: 5,
        resources: [{ type: "article", title: "Docker Bench for Security" }],
        labs: ["Run trivy/grype against an image and fix a CVE"] }),
    ]),

    phase("IV · Kubernetes (CKA-aligned)", [
      m("K8s core: pods, deployments, services, ingress", { hours: 40, proficiency: 7,
        resources: [{ type: "course", title: "CKA prep (KodeKloud or Mumshad)" }, { type: "docs", title: "kubernetes.io docs" }],
        labs: ["Deploy the 3-tier app on minikube/kind with HPA + ingress"] }),
      m("ConfigMaps, Secrets, volumes, StatefulSets", { hours: 20, proficiency: 7,
        labs: ["Deploy Postgres as a StatefulSet with PV + backup sidecar"] }),
      m("Helm charts & Kustomize", { hours: 15, proficiency: 6,
        projects: ["Package the app as a Helm chart with values per environment"] }),
      m("Observability on K8s: Prometheus + Grafana + Loki", { hours: 25, proficiency: 6,
        projects: ["Build a dashboard that shows RED metrics for your services"] }),
    ]),

    phase("V · Infrastructure as Code", [
      m("Terraform: HCL, providers, state, modules", { hours: 30, proficiency: 7,
        resources: [{ type: "course", title: "Terraform Associate prep" }],
        projects: ["Terraform a VPC + EKS/GKE cluster + node pools from scratch"] }),
      m("Ansible for config management", { hours: 20, proficiency: 6,
        projects: ["Ansible playbook to harden 5 servers (SSH, firewall, updates)"] }),
    ]),

    phase("VI · CI/CD", [
      m("GitHub Actions / GitLab CI pipelines", { hours: 25, proficiency: 7,
        projects: ["Build a pipeline: lint → test → build image → push to registry → deploy to staging on tag"] }),
      m("ArgoCD / Flux GitOps", { hours: 20, proficiency: 6,
        projects: ["GitOps deploy the Helm chart; image updater auto-syncs tags"] }),
    ]),

    phase("VII · Cloud Deep Dive (pick AWS, GCP, or Azure)", [
      m("Compute, networking, IAM, storage fundamentals", { hours: 40, proficiency: 7,
        resources: [{ type: "course", title: "Cloud Practitioner / Associate-level course" }],
        labs: ["Deploy a serverless REST API with API GW + Lambda + DynamoDB"] }),
      m("Managed K8s (EKS/GKE/AKS), IAM roles for SA", { hours: 25, proficiency: 7 }),
    ]),

    phase("VIII · Observability & SRE", [
      m("Monitoring: PromQL, alerting, SLOs", { hours: 25, proficiency: 7,
        resources: [{ type: "book", title: "Site Reliability Engineering (Google)" }],
        projects: ["Define 3 SLOs, wire burn-rate alerts, run an error budget review"] }),
      m("Distributed tracing (OpenTelemetry + Jaeger/Tempo)", { hours: 15, proficiency: 6 }),
      m("Incident response & blameless postmortems", { hours: 8, proficiency: 5 }),
    ]),
  ],
};

// ---------------- NETWORKING ----------------
const networking: CareerRoadmap = {
  id: "tpl-networking",
  name: "Networking Engineer",
  icon: "🌐",
  color: "#8b5cf6",
  template: "networking",
  description: "OSI layers → TCP/IP → routing/switching → security → automation → cloud networking.",
  weeklyHoursTarget: 6,
  priority: 7,
  status: "active",
  startLevel: 2,
  targetLevel: 8,
  startedAt: Date.now(),
  phases: [
    phase("I · Foundations", [
      m("OSI model & TCP/IP stack deep dive", { hours: 20, proficiency: 7,
        resources: [{ type: "book", title: "Computer Networking: A Top-Down Approach (Kurose & Ross)" }],
        labs: ["Draw packet flow for DNS lookup + HTTPS request across all 7 layers"] }),
      m("IP addressing, subnetting, CIDR, VLSM", { hours: 20, proficiency: 8,
        labs: ["Subnet 10.0.0.0/12 into 500 subnets; verify with ipcalc"] }),
      m("ARP, DHCP, DNS, NAT", { hours: 15, proficiency: 6 }),
    ]),

    phase("II · Switching (CCNA-aligned)", [
      m("VLANs, trunking (802.1Q), STP, VTP", { hours: 25, proficiency: 7,
        resources: [{ type: "course", title: "CCNA (Wendell Odom books / Neil Anderson course)" }],
        labs: ["Configure 3 switches with VLANs, trunk, and rapid PVST+ in Packet Tracer / EVE-NG"] }),
      m("EtherChannel/LACP, port security", { hours: 12, proficiency: 6 }),
    ]),

    phase("III · Routing", [
      m("Static routing & default route", { hours: 8, proficiency: 6 }),
      m("OSPFv2 single-area", { hours: 25, proficiency: 7,
        labs: ["Build a 5-router OSPF topology; tune DR/BDR and costs"] }),
      m("BGP fundamentals (eBGP/iBGP, path selection)", { hours: 35, proficiency: 6,
        resources: [{ type: "book", title: "Routing TCP/IP Vol II (Doyle)" }],
        labs: ["Peer two ISPs, advertise prefixes, influence outbound with local-preference"] }),
      m("ACLs & route maps", { hours: 15, proficiency: 6 }),
    ]),

    phase("IV · Network Services & Security", [
      m("NAT/PAT, DHCP relay, NTP, AAA (RADIUS/TACACS+)", { hours: 18, proficiency: 6 }),
      m("Firewalls & zone-based policy (pfSense/ASA)", { hours: 25, proficiency: 6,
        projects: ["Set up pfSense at home with 3 zones, HA, and VPN for remote access"] }),
      m("VPNs: IPsec site-to-site, WireGuard, OpenVPN", { hours: 25, proficiency: 6 }),
    ]),

    phase("V · Automation & Programmability", [
      m("Python + Netmiko / NAPALM / Nornir", { hours: 30, proficiency: 7,
        projects: ["Build a script that backs up configs of 20 devices nightly"] }),
      m("Ansible for networking", { hours: 20, proficiency: 6 }),
      m("RESTCONF / NETCONF / YANG", { hours: 15, proficiency: 5 }),
    ]),

    phase("VI · Advanced / Cloud Networking", [
      m("MPLS & SD-WAN fundamentals", { hours: 25, proficiency: 5 }),
      m("Cloud networking (AWS VPC / GCP VPC / Azure VNet)", { hours: 35, proficiency: 7,
        projects: ["Hub-and-spoke VPC with transit gateway, peering, and private link"] }),
      m("Network observability: NetFlow/IPFIX, sFlow, SNMP", { hours: 15, proficiency: 6 }),
    ]),
  ],
};

// ---------------- LINUX ----------------
const linux: CareerRoadmap = {
  id: "tpl-linux",
  name: "Linux Sysadmin / Power User",
  icon: "🐧",
  color: "#f59e0b",
  template: "linux",
  description: "From comfortable on the CLI to confident sysadmin — tools, services, kernel, performance.",
  weeklyHoursTarget: 5,
  priority: 8,
  status: "active",
  startLevel: 3,
  targetLevel: 8,
  startedAt: Date.now(),
  phases: [
    phase("I · CLI Mastery", [
      m("Shell essentials, navigation, globbing, brace expansion", { hours: 12, proficiency: 7,
        resources: [{ type: "book", title: "The Linux Command Line" }, { type: "course", title: "Linux UpSkill Challenge" }],
        labs: ["Rewrite 5 daily tasks using only the shell (no GUI file manager)"] }),
      m("Core utils: find, xargs, grep/ripgrep, awk, sed, sort/uniq/comm", { hours: 20, proficiency: 7,
        projects: ["Parse an Nginx log into top-10 IPs, top URLs, and 4xx/5xx counts with awk"] }),
      m("tmux + ssh multiplexing + dotfiles", { hours: 8, proficiency: 6,
        projects: ["Version-control your dotfiles in a git repo with a bootstrap script"] }),
    ]),

    phase("II · Users, Permissions, Filesystems", [
      m("Users, groups, sudo, PAM", { hours: 10, proficiency: 7,
        labs: ["Create a shared team group with umask 002 and sudoers that lets them run one command"] }),
      m("Permissions (incl. ACLs, POSIX caps, chmod/chattr)", { hours: 12, proficiency: 7 }),
      m("Filesystems: ext4, xfs, btrfs; LVM; mounts & fstab", { hours: 18, proficiency: 6 }),
    ]),

    phase("III · Services & Systemd", [
      m("systemd units, targets, timers, journald", { hours: 18, proficiency: 7,
        projects: ["Write a unit file for your own daemon + a timer that runs it nightly"] }),
      m("Package management (apt/dnf/apk), repos, building from source", { hours: 10, proficiency: 6 }),
      m("Cron, at, anacron", { hours: 6, proficiency: 6 }),
    ]),

    phase("IV · Networking on Linux", [
      m("iproute2 (ip, ss, tc), netplan/NetworkManager", { hours: 14, proficiency: 7 }),
      m("Firewalls: nftables/iptables, ufw, firewalld", { hours: 15, proficiency: 6 }),
      m("DNS (bind9/unbound), NFS/Samba, NTP", { hours: 20, proficiency: 6,
        projects: ["Set up a LAN with DNS, NFS homes, and local NTP"] }),
    ]),

    phase("V · Security & Hardening", [
      m("SSH hardening (keys, fail2ban, 2FA)", { hours: 10, proficiency: 7 }),
      m("SELinux / AppArmor", { hours: 15, proficiency: 5 }),
      m("Audit: auditd, Lynis, OpenSCAP", { hours: 12, proficiency: 5 }),
    ]),

    phase("VI · Performance & Troubleshooting", [
      m("Observability: top/htop, iostat, vmstat, sar, pidstat, ss", { hours: 20, proficiency: 7,
        resources: [{ type: "article", title: "Brendan Gregg's Linux Performance Tools map" }],
        labs: ["Diagnose a CPU/memory/disk-bound workload with USE method"] }),
      m("strace/ltrace, perf, eBPF (bpftrace)", { hours: 25, proficiency: 6 }),
      m("Kernel tuning: sysctl, swappiness, scheduler, IO schedulers", { hours: 15, proficiency: 5 }),
    ]),

    phase("VII · Containers & Advanced", [
      m("Docker/Podman on Linux, rootless containers", { hours: 20, proficiency: 7 }),
      m("KVM/libvirt virtualization", { hours: 18, proficiency: 5 }),
      m("Kernel building / patching (optional deep dive)", { hours: 25, proficiency: 4 }),
    ]),
  ],
};

// ---------------- MLOPS ----------------
const mlops: CareerRoadmap = {
  id: "tpl-mlops",
  name: "MLOps Engineer",
  icon: "🧠",
  color: "#ec4899",
  template: "mlops",
  description: "ML fundamentals → production pipelines → model serving → monitoring → LLMOps.",
  weeklyHoursTarget: 8,
  priority: 8,
  status: "active",
  startLevel: 3,
  targetLevel: 8,
  startedAt: Date.now(),
  phases: [
    phase("I · Python & ML Foundations", [
      m("Python data stack: NumPy, Pandas, Matplotlib", { hours: 35, proficiency: 7,
        resources: [{ type: "book", title: "Python for Data Analysis (McKinney)" }],
        projects: ["EDA notebook on a real Kaggle dataset with visual storytelling"] }),
      m("Scikit-learn: regression, classification, CV, pipelines", { hours: 35, proficiency: 7,
        projects: ["Kaggle-style end-to-end tabular competition solution (top 30%)"] }),
      m("ML theory fundamentals (bias/variance, regularization, evaluation)", { hours: 25, proficiency: 7,
        resources: [{ type: "book", title: "An Introduction to Statistical Learning (free)" }] }),
    ]),

    phase("II · Deep Learning Basics", [
      m("PyTorch: tensors, autograd, modules", { hours: 25, proficiency: 6,
        resources: [{ type: "course", title: "fast.ai Practical Deep Learning" }, { type: "docs", title: "pytorch.org tutorials" }] }),
      m("Train CNNs for vision; transformers for text", { hours: 40, proficiency: 7,
        projects: ["Fine-tune a small vision model on a custom dataset, deployable checkpoint"] }),
    ]),

    phase("III · Experiment Tracking & Versioning", [
      m("Git LFS, DVC for data/model versioning", { hours: 15, proficiency: 6 }),
      m("MLflow / Weights & Biases for tracking", { hours: 20, proficiency: 7,
        projects: ["Log 50 experiments for a project, compare runs, register the best model"] }),
    ]),

    phase("IV · Feature Engineering & Data", [
      m("Feature stores (Feast), data validation (Great Expectations)", { hours: 20, proficiency: 6 }),
      m("Airflow/Prefect for data pipelines", { hours: 25, proficiency: 6,
        projects: ["Build an Airflow DAG that fetches, validates, featurizes, and trains daily"] }),
    ]),

    phase("V · Training at Scale", [
      m("PyTorch DDP, mixed precision, gradient accumulation", { hours: 25, proficiency: 6 }),
      m("Cloud GPU training: Lambda / Vertex AI / SageMaker", { hours: 25, proficiency: 6 }),
      m("Hyperparameter tuning (Optuna/Ray Tune)", { hours: 15, proficiency: 6 }),
    ]),

    phase("VI · Model Serving", [
      m("REST APIs with FastAPI; batch vs real-time", { hours: 20, proficiency: 7,
        projects: ["Serve a model via FastAPI with Pydantic validation, tests, Dockerfile"] }),
      m("TorchScript / ONNX / TensorRT optimization", { hours: 20, proficiency: 6 }),
      m("High-throughput serving: Triton / vLLM for LLMs", { hours: 25, proficiency: 6 }),
    ]),

    phase("VII · ML Infrastructure & Kubernetes", [
      m("Kubeflow / KServe / MLflow on K8s", { hours: 30, proficiency: 6 }),
      m("Model registries & CI/CD for ML (CT/CD)", { hours: 20, proficiency: 6 }),
    ]),

    phase("VIII · Monitoring & LLMOps", [
      m("Drift detection: data drift, concept drift (Evidently AI)", { hours: 20, proficiency: 6 }),
      m("LLM ops: RAG, evaluation, prompt management (LangChain/LlamaIndex)", { hours: 40, proficiency: 7,
        projects: ["Build a RAG system on your own docs with retrieval eval (RAGAS/trulens)"] }),
    ]),
  ],
};

// ---------------- CLOUD ----------------
const cloud: CareerRoadmap = {
  id: "tpl-cloud",
  name: "Cloud Engineer (AWS focus, multi-cloud aware)",
  icon: "☁️",
  color: "#a3e635",
  template: "cloud",
  description: "Core cloud services → architecture → IaC → serverless → cost/security/FinOps.",
  weeklyHoursTarget: 7,
  priority: 8,
  status: "active",
  startLevel: 2,
  targetLevel: 9,
  startedAt: Date.now(),
  phases: [
    phase("I · Cloud Fundamentals", [
      m("Core concepts: regions/AZs, IAM, shared responsibility", { hours: 15, proficiency: 7,
        resources: [{ type: "course", title: "AWS Cloud Practitioner / GCP Cloud Digital Leader" }],
        labs: ["Create an IAM admin user with MFA, no root access keys"] }),
      m("SDKs & CLI (awscli/gcloud/az)", { hours: 10, proficiency: 6 }),
    ]),

    phase("II · Networking & Compute", [
      m("VPC: subnets, route tables, security groups, NACL, NAT GW", { hours: 25, proficiency: 7,
        projects: ["Design a 3-tier VPC from scratch with public/private subnets"] }),
      m("EC2 / GCE: instances, ASGs, load balancers, SSH/Session Manager", { hours: 25, proficiency: 7,
        labs: ["Deploy an ASG + ALB with health checks and auto-scaling policies"] }),
      m("DNS (Route53/Cloud DNS) & CDN (CloudFront/Cloud CDN)", { hours: 12, proficiency: 6 }),
    ]),

    phase("III · Storage & Data", [
      m("Object storage: S3/GCS buckets, policies, versioning, pre-signed URLs", { hours: 12, proficiency: 7,
        projects: ["Host a static site on S3 + CloudFront with OAC"] }),
      m("Block/block volumes, managed DBs (RDS/Cloud SQL), caching (ElastiCache/Memorystore)", { hours: 25, proficiency: 7 }),
    ]),

    phase("IV · Identity, Security & Compliance", [
      m("IAM: roles/policies, SCPs, federation, OIDC/SAML", { hours: 25, proficiency: 7 }),
      m("Secrets Manager / KMS / CloudHSM; encryption at rest/in transit", { hours: 15, proficiency: 6 }),
      m("Audit & Guardrails: CloudTrail/Cloud Audit Logs, Config, Security Command Center", { hours: 15, proficiency: 6 }),
    ]),

    phase("V · Containers & Orchestration", [
      m("ECR/GCR/ACR, ECS/Cloud Run/App Service, Fargate", { hours: 25, proficiency: 7 }),
      m("Managed Kubernetes (EKS/GKE/AKS)", { hours: 35, proficiency: 7,
        projects: ["Deploy a microservice to EKS with ALB Ingress + IRSA + Karpenter"] }),
    ]),

    phase("VI · Serverless & Event-Driven", [
      m("Lambda / Cloud Functions: triggers, layers, cold starts", { hours: 20, proficiency: 7,
        projects: ["Image-resize pipeline: S3 → Lambda → S3 thumbnail + DynamoDB record"] }),
      m("Eventing: SNS/SQS/EventBridge/Pub-Sub", { hours: 18, proficiency: 7 }),
      m("Step Functions / Cloud Workflows for orchestration", { hours: 15, proficiency: 6 }),
    ]),

    phase("VII · IaC & DevOps on Cloud", [
      m("Terraform for AWS/GCP, remote state + workspaces", { hours: 30, proficiency: 7 }),
      m("CI/CD to cloud (GitHub Actions OIDC → cloud, no long-lived keys)", { hours: 20, proficiency: 7 }),
    ]),

    phase("VIII · Architecture & FinOps", [
      m("Well-Architected Framework (AWS) / pillars", { hours: 15, proficiency: 6,
        resources: [{ type: "book", title: "AWS Well-Architected Framework docs" }] }),
      m("Cost management: budgets, tags, Cost Explorer, Compute Savings Plans", { hours: 15, proficiency: 6 }),
      m("Multi-cloud & hybrid patterns (anthos/arc/outpost)", { hours: 20, proficiency: 5 }),
    ]),
  ],
};

export const ROADMAP_TEMPLATES: Record<string, CareerRoadmap> = {
  devops,
  networking,
  linux,
  mlops,
  cloud,
};

export const TEMPLATE_LIST: CareerRoadmap[] = [devops, networking, linux, mlops, cloud];

/** Build a fresh copy of a template (re-ids milestones/phases so they don't collide). */
export function cloneTemplate(templateId: string): CareerRoadmap | null {
  const tpl = ROADMAP_TEMPLATES[templateId];
  if (!tpl) return null;
  const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  return {
    ...tpl,
    id: newId("rm"),
    startedAt: Date.now(),
    phases: tpl.phases.map((ph) => ({
      ...ph,
      id: newId("ph"),
      milestones: ph.milestones.map((ms) => ({
        ...ms,
        id: newId("ms"),
        resources: ms.resources.map((r) => ({ ...r, id: newId("res") })),
        projects: ms.projects.map((p) => ({ ...p, id: newId("prj") })),
        labChecklist: ms.labChecklist.map((l) => ({ ...l, id: newId("lab") })),
        quiz: ms.quiz.map((q) => ({ ...q, id: newId("qz") })),
      })),
    })),
  };
}

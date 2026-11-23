-- Optional local/demo catalog seed. All seeded rows remain visibly marked as demo.
insert into public.departments (slug, name, code)
values ('shared-research-facilities', 'Shared Research Facilities', 'SRF')
on conflict (slug) do nothing;

insert into public.equipment (
  slug, department_id, name, category, lab_name, building, floor, description,
  image_url, specifications, status, utilization_percent, rating, next_available_at,
  training_required, is_demo_seed
)
select sample.slug, d.id, sample.name, sample.category, sample.lab_name, sample.building, sample.floor,
       sample.description, sample.image_url, sample.specifications::jsonb, sample.status,
       sample.utilization_percent, sample.rating, sample.next_available_at, sample.training_required, true
from public.departments d
cross join (values
  ('sem-01','Scanning Electron Microscope','Imaging','Advanced Materials Lab','Innovation Center','Level 3','High-resolution surface imaging for advanced materials research.','https://images.unsplash.com/photo-1581093458791-9d42e3c4f8c2?auto=format&fit=crop&w=900&q=85','{"Resolution":"1.2 nm @ 30 kV","Magnification":"20× – 500,000×","Accelerating voltage":"0.5 – 30 kV","Sample chamber":"Ø 150 mm × 80 mm"}','available',72,4.9,now()+interval '2 hours',true),
  ('pcr-02','Real-Time PCR System','Molecular Biology','Molecular Discovery Lab','Science Hall','Level 2','Quantitative PCR platform for sensitive nucleic acid detection and gene expression analysis.','https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=85','{"Throughput":"96-well plate","Detection channels":"5-color multiplex","Temperature range":"4 – 100 °C","Ramp rate":"Up to 6 °C/s"}','in_use',86,4.8,now()+interval '5 hours',true),
  ('3dp-03','Industrial 3D Printer','Fabrication','Digital Fabrication Studio','Innovation Center','Level 1','Precision fused-filament fabrication for rapid prototyping with multi-material support.','https://images.unsplash.com/photo-1631556097152-c39479bbff8f?auto=format&fit=crop&w=900&q=85','{"Build volume":"300 × 300 × 400 mm","Layer resolution":"50 – 300 μm","Materials":"PLA, ABS, PETG, Nylon","Nozzle temperature":"Up to 300 °C"}','available',58,4.7,now()+interval '1 hour',false),
  ('ms-04','Mass Spectrometer','Analytical Chemistry','Analytical Chemistry Lab','Science Hall','Level 4','High-sensitivity LC-MS system for molecular identification and quantification.','https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=85','{"Mass range":"m/z 50 – 2,000","Mass accuracy":"< 1 ppm RMS","Ionization":"ESI, APCI, APPI","Polarity":"Positive & negative"}','maintenance',91,4.9,now()+interval '1 day',true),
  ('conf-05','Confocal Microscope','Imaging','Cell Imaging Suite','Life Sciences Building','Level 2','Laser scanning confocal microscope for live-cell imaging and 3D fluorescence microscopy.','https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=900&q=85','{"Objectives":"10× – 100× oil","Laser lines":"405, 488, 561, 633 nm","Detector":"GaAsP spectral","Stage":"Motorized XYZ"}','available',64,5.0,now()+interval '4 hours',true),
  ('centr-06','Ultracentrifuge','Molecular Biology','Protein Sciences Lab','Life Sciences Building','Level 1','Floor-standing ultracentrifuge for high-speed separation of proteins and cellular components.','https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=900&q=85','{"Maximum speed":"100,000 rpm","Maximum RCF":"802,000 × g","Temperature":"0 – 40 °C","Rotor options":"6 compatible rotors"}','available',47,4.6,now()+interval '90 minutes',true)
) as sample(slug,name,category,lab_name,building,floor,description,image_url,specifications,status,utilization_percent,rating,next_available_at,training_required)
where d.slug = 'shared-research-facilities'
on conflict (slug) do nothing;

-- Engineering equipment catalog for PromptWars. These catalog rows are visibly
-- marked as demo seed data. Re-running this file leaves existing rows untouched.
insert into public.departments (slug, name, code)
values
  ('cse', 'Computer Science & Engineering', 'CSE'),
  ('ai-ml', 'AI & ML', 'AIML'),
  ('ece', 'Electronics & Communication Engineering', 'ECE'),
  ('mechanical', 'Mechanical Engineering', 'MECH'),
  ('robotics', 'Robotics', 'ROBOT')
on conflict do nothing;

insert into public.equipment (
  id, slug, department_id, name, category, lab_name, building, floor,
  description, specifications, status, utilization_percent, rating,
  next_available_at, training_required, is_demo_seed, is_active
)
select sample.id::uuid, sample.slug, d.id, sample.name, sample.category,
       sample.lab_name, sample.building, sample.floor, sample.description,
       sample.specifications::jsonb, 'available', 0, 0, null,
       sample.training_required, true, true
from (values
  ('e1000000-0000-4000-8000-000000000001','arduino-uno-kit','ece','Arduino Uno Kit','Embedded Systems','Embedded Systems Lab','Electronics Block','Floor 2','A classroom-ready Arduino Uno kit for introductory embedded programming, sensor integration, and rapid electronics prototyping.','{"Board":"Arduino Uno R3","Microcontroller":"ATmega328P","Included":"USB cable, breadboard, jumper wires, LED and sensor assortment","Kit quantity":"1 kit"}',false),
  ('e1000000-0000-4000-8000-000000000002','raspberry-pi','cse','Raspberry Pi','Single-board Computing','IoT and Systems Lab','Computing Block','Floor 3','Raspberry Pi development station for Linux, networking, IoT, and edge-computing coursework and research.','{"Model":"Raspberry Pi 4 Model B","Memory":"4 GB","Connectivity":"Dual-band Wi-Fi, Bluetooth, Gigabit Ethernet","Included":"Power supply, case and 32 GB microSD card"}',false),
  ('e1000000-0000-4000-8000-000000000003','jetson-nano','ai-ml','Jetson Nano','AI and Edge Computing','Edge AI Lab','Innovation Center','Floor 2','NVIDIA Jetson Nano station for prototyping computer-vision and edge inference workloads.','{"Module":"Jetson Nano 4 GB","GPU":"128-core NVIDIA Maxwell","Memory":"4 GB LPDDR4","Included":"Carrier board, power adapter and cooling kit"}',true),
  ('e1000000-0000-4000-8000-000000000004','digital-oscilloscope','ece','Digital Oscilloscope','Test and Measurement','Electronics Instrumentation Lab','Electronics Block','Floor 1','Bench oscilloscope for observing, measuring, and debugging analog and digital circuits.','{"Bandwidth":"100 MHz","Channels":"4 analog channels","Sample rate":"1 GSa/s","Display":"7-inch color display"}',true),
  ('e1000000-0000-4000-8000-000000000005','3d-printer','mechanical','3D Printer','Digital Fabrication','Rapid Prototyping Studio','Workshop Block','Floor 1','Enclosed fused-filament 3D printer for producing research fixtures, mechanical prototypes, and teaching models.','{"Technology":"Fused filament fabrication","Build volume":"220 × 220 × 250 mm","Layer height":"0.10–0.30 mm","Materials":"PLA, PETG and TPU"}',true),
  ('e1000000-0000-4000-8000-000000000006','gpu-workstation','ai-ml','GPU Workstation','AI Computing','Machine Learning Lab','Computing Block','Floor 4','GPU-equipped workstation for model training, computer vision, simulation, and accelerated data analysis.','{"GPU":"NVIDIA RTX-class, 16 GB VRAM","CPU":"16-core workstation processor","Memory":"64 GB RAM","Storage":"2 TB NVMe SSD"}',true),
  ('e1000000-0000-4000-8000-000000000007','robotics-development-kit','robotics','Robotics Development Kit','Robotics','Autonomous Systems Lab','Robotics Center','Floor 1','Mobile robotics kit for control, localization, sensor fusion, and autonomous navigation experiments.','{"Controller":"ROS 2-compatible compute module","Sensors":"2D lidar, IMU and wheel encoders","Drive":"Differential drive chassis","Included":"Battery, charger and safety stop"}',true),
  ('e1000000-0000-4000-8000-000000000008','research-microscope','mechanical','Microscope','Optical Inspection','Materials Characterization Lab','Workshop Block','Floor 2','Upright optical microscope for inspecting material surfaces, manufactured parts, and prepared samples.','{"Optics":"Plan achromatic objectives 4×, 10×, 40× and 100×","Illumination":"LED transmitted and reflected light","Camera":"5 MP digital camera","Stage":"Mechanical XY stage"}',true),
  ('e1000000-0000-4000-8000-000000000009','cnc-machine','mechanical','CNC Machine','Computer Numerical Control','CNC Fabrication Lab','Workshop Block','Floor 1','Three-axis CNC milling machine for supervised fabrication of prototypes and research components.','{"Axes":"3-axis","Work area":"600 × 400 × 100 mm","Spindle":"1.5 kW, up to 24,000 rpm","Materials":"Aluminum, plastics and machinable wax"}',true),
  ('e1000000-0000-4000-8000-000000000010','fpga-development-board','ece','FPGA Development Board','Digital Design','VLSI and Digital Systems Lab','Electronics Block','Floor 3','FPGA development platform for digital logic, signal processing, hardware acceleration, and embedded design labs.','{"FPGA":"Mid-range Artix-7 family device","Logic cells":"~33,000","Interfaces":"HDMI, Ethernet, USB and GPIO headers","Tools":"Vendor synthesis tools; student license required"}',true)
) as sample(id,slug,department_slug,name,category,lab_name,building,floor,description,specifications,training_required)
join public.departments d on d.slug = sample.department_slug
on conflict do nothing;

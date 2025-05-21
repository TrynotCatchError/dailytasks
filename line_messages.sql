-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 19, 2025 at 09:16 AM
-- Server version: 10.11.6-MariaDB-0+deb12u1-log
-- PHP Version: 8.4.5

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `karinssk_job002`
--

-- --------------------------------------------------------

--
-- Table structure for table `line_messages`
--

CREATE TABLE `line_messages` (
  `id` int(11) NOT NULL,
  `user_id` varchar(100) NOT NULL,
  `message` text DEFAULT NULL,
  `command` varchar(50) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `line_messages`
--

INSERT INTO `line_messages` (`id`, `user_id`, `message`, `command`, `content`, `created_at`) VALUES
(1, 'Ud580f5646afc4193eb680477e21ceebe', '#create projectdemo', 'create', 'projectdemo', '2025-05-18 14:58:05'),
(2, 'Ud580f5646afc4193eb680477e21ceebe', '#create projectdem02', 'create', 'projectdem02', '2025-05-18 15:02:49'),
(3, 'Ud580f5646afc4193eb680477e21ceebe', '#create projectdem by1234 fff', 'create', 'projectdem by1234 fff', '2025-05-18 15:03:19'),
(4, 'Ud580f5646afc4193eb680477e21ceebe', '#create projectdem02 array1 array2 array4', 'create', 'projectdem02 array1 array2 array4', '2025-05-18 15:05:30'),
(5, 'Ud580f5646afc4193eb680477e21ceebe', '#create projectdem02 array1 array2 array4', 'create', 'projectdem02 array1 array2 array4', '2025-05-18 15:13:03'),
(6, 'Ud580f5646afc4193eb680477e21ceebe', '#create Team Meeting: Agenda: 1. Project updates 2. Resource allocation 3. Next steps\n', 'create', 'Team Meeting: Agenda: 1. Project updates 2. Resource allocation 3. Next steps', '2025-05-18 15:14:54'),
(7, 'Ud580f5646afc4193eb680477e21ceebe', '#create Monthly Report: 1. Collect data 2. Analyze results 3. Create presentation\n', 'create', 'Monthly Report: 1. Collect data 2. Analyze results 3. Create presentation', '2025-05-18 15:15:17'),
(8, 'Ud580f5646afc4193eb680477e21ceebe', '#create Website Redesign: - Update color scheme - Add new product section - Optimize for mobile\n', 'create', 'Website Redesign: - Update color scheme - Add new product section - Optimize for mobile', '2025-05-18 15:16:16'),
(9, 'Ud580f5646afc4193eb680477e21ceebe', '#create Monthly Report: 1. Collect data 2. Analyze results 3. Create presentation @RUBYSHOP Sale. (New) \n', 'create', 'Monthly Report: 1. Collect data 2. Analyze results 3. Create presentation @RUBYSHOP Sale. (New)', '2025-05-18 16:22:33'),
(10, 'Ud580f5646afc4193eb680477e21ceebe', '#create Website Redesign: - Update color scheme - Add new product section - Optimize for mobile @RUBYSHOP Sale. (New) \n', 'create', 'Website Redesign: - Update color scheme - Add new product section - Optimize for mobile @RUBYSHOP Sale. (New)', '2025-05-18 16:23:41'),
(11, 'Ud580f5646afc4193eb680477e21ceebe', '#create Product Launch: Prepare marketing materials and coordinate with sales team @RUBYSHOP Sale. (New) \n', 'create', 'Product Launch: Prepare marketing materials and coordinate with sales team @RUBYSHOP Sale. (New)', '2025-05-18 16:24:12'),
(12, 'Ud580f5646afc4193eb680477e21ceebe', '#create Product Launch', 'create', 'Product Launch', '2025-05-18 16:27:03'),
(13, 'Ud580f5646afc4193eb680477e21ceebe', '#create Urgent Bug Fix: Fix login issue on Safari browser @All \n', 'create', 'Urgent Bug Fix: Fix login issue on Safari browser @All', '2025-05-18 16:31:05'),
(14, 'Ud580f5646afc4193eb680477e21ceebe', '#create Product Launch', 'create', 'Product Launch', '2025-05-18 16:47:21'),
(15, 'Ud580f5646afc4193eb680477e21ceebe', '#update Monthly Report: Fixed 100 bugs and called the manager\n', 'update', 'Monthly Report: Fixed 100 bugs and called the manager', '2025-05-18 16:47:42'),
(16, 'Ud580f5646afc4193eb680477e21ceebe', '#update Monthly Report: Fixed 100 bugs and called the manager\n', 'update', 'Monthly Report: Fixed 100 bugs and called the manager', '2025-05-18 16:48:25'),
(17, 'Ud580f5646afc4193eb680477e21ceebe', '#update Product Launch: Fixed 100 bugs and called the manager\n', 'update', 'Product Launch: Fixed 100 bugs and called the manager', '2025-05-18 16:49:34'),
(18, 'Ud580f5646afc4193eb680477e21ceebe', '#create Urgent Bug Fix999: Fix login issue on Safari browser @RUBYSHOP Sale. (New) \n', 'create', 'Urgent Bug Fix999: Fix login issue on Safari browser @RUBYSHOP Sale. (New)', '2025-05-18 16:50:51'),
(19, 'Ud580f5646afc4193eb680477e21ceebe', '#update Urgent Bug Fix99: Fixed 10000000 bugsssss and called the managerrrrr\n', 'update', 'Urgent Bug Fix99: Fixed 10000000 bugsssss and called the managerrrrr', '2025-05-18 16:51:43'),
(20, 'Ud580f5646afc4193eb680477e21ceebe', '#update Urgent Bug Fix99222: Fixed 10000000 bugsssss and called the managerrrrr\n', 'update', 'Urgent Bug Fix99222: Fixed 10000000 bugsssss and called the managerrrrr', '2025-05-18 16:52:29'),
(21, 'Ud580f5646afc4193eb680477e21ceebe', '#findmore', 'findmore', '', '2025-05-18 16:52:39'),
(22, 'Ud580f5646afc4193eb680477e21ceebe', '#findall', 'findall', '', '2025-05-18 16:53:02'),
(23, 'Ud580f5646afc4193eb680477e21ceebe', '#create Product Launch999: Prepare marketing materials and coordinate with sales team @RUBYSHOP Sale. (New) \n', 'create', 'Product Launch999: Prepare marketing materials and coordinate with sales team @RUBYSHOP Sale. (New)', '2025-05-18 16:57:23'),
(24, 'Ud580f5646afc4193eb680477e21ceebe', '#update Product Launch999: Prepare marketing materials and coordinate with sales team 555\n', 'update', 'Product Launch999: Prepare marketing materials and coordinate with sales team 555', '2025-05-18 16:58:20'),
(25, 'Ud580f5646afc4193eb680477e21ceebe', '#create Urgent Bug Fixxxx: Fix login issue on Safari browser @RUBYSHOP Sale. (New) \n', 'create', 'Urgent Bug Fixxxx: Fix login issue on Safari browser @RUBYSHOP Sale. (New)', '2025-05-18 16:59:03'),
(26, 'Ud580f5646afc4193eb680477e21ceebe', '#create ซ่อมเครื่่องกรีดผนัง 100A: ลูกค้าคุณ สุรานารี น้ำเครื่องมาจากยะลา ค่ะ @RUBYSHOP Sale. (New) \n', 'create', 'ซ่อมเครื่่องกรีดผนัง 100A: ลูกค้าคุณ สุรานารี น้ำเครื่องมาจากยะลา ค่ะ @RUBYSHOP Sale. (New)', '2025-05-18 17:00:43'),
(27, 'Ud580f5646afc4193eb680477e21ceebe', '#update ซ่อมเครื่่องกรีดผนัง 100A: ซ่อมเสร็จแล้วค่ะ  ถ่ายรูป ... (hands together)', 'update', 'ซ่อมเครื่่องกรีดผนัง 100A: ซ่อมเสร็จแล้วค่ะ  ถ่ายรูป ... (hands together)', '2025-05-18 17:03:07'),
(28, 'Ud580f5646afc4193eb680477e21ceebe', '#update ซ่อมเครื่่องกรีดผนัง 100A1: ซ่อมเสร็จแล้วค่ะ  ถ่ายรูป ... (hands together)', 'update', 'ซ่อมเครื่่องกรีดผนัง 100A1: ซ่อมเสร็จแล้วค่ะ  ถ่ายรูป ... (hands together)', '2025-05-18 17:03:23'),
(29, 'Ud580f5646afc4193eb680477e21ceebe', '#findmore', 'findmore', '', '2025-05-18 17:03:32'),
(30, 'Ud580f5646afc4193eb680477e21ceebe', '#findall', 'findall', '', '2025-05-18 17:04:10'),
(31, 'Ud580f5646afc4193eb680477e21ceebe', '#create addmintest: test only', 'create', 'addmintest: test only', '2025-05-18 17:15:30'),
(32, 'Ud580f5646afc4193eb680477e21ceebe', '#findmore', 'findmore', '', '2025-05-18 17:15:41'),
(33, 'Ud580f5646afc4193eb680477e21ceebe', '#สร้างโปรเจค addmintest555: test only', 'สร้างโปรเจค', 'addmintest555: test only', '2025-05-18 17:33:37'),
(34, 'Ud580f5646afc4193eb680477e21ceebe', '#create addmintest: test only', 'create', 'addmintest: test only', '2025-05-18 17:45:32'),
(35, 'Ud580f5646afc4193eb680477e21ceebe', '#create lol: gameplay : alkjfalfjd @RUBYSHOP Sale. (New) ', 'create', 'lol: gameplay : alkjfalfjd @RUBYSHOP Sale. (New)', '2025-05-18 18:44:49'),
(36, 'Ud580f5646afc4193eb680477e21ceebe', '#create ซ่อมเครื่องยนต์', 'create', 'ซ่อมเครื่องยนต์', '2025-05-18 18:46:11'),
(37, 'Ud580f5646afc4193eb680477e21ceebe', '#newtask ซ่อมเครื่องยนต์: อัพเดทความคืบหน้า: ซ่อมไปแล้ว 3 เครื่อง เหลืออีก 1 เครื่อง จะเสร็จพรุ่งนี้ @RUBYSHOP Sale. (New) \n', 'newtask', 'ซ่อมเครื่องยนต์: อัพเดทความคืบหน้า: ซ่อมไปแล้ว 3 เครื่อง เหลืออีก 1 เครื่อง จะเสร็จพรุ่งนี้ @RUBYSHOP Sale. (New)', '2025-05-18 18:49:58'),
(38, 'Ud580f5646afc4193eb680477e21ceebe', '#newtask ซ่อมเครื่องยนต์: อัพเดทความคืบหน้า: ซ่อมไปแล้ว 3 เครื่อง เหลืออีก 1 เครื่อง จะเสร็จพรุ่งนี้ @RUBYSHOP Sale. (New) ', 'newtask', 'ซ่อมเครื่องยนต์: อัพเดทความคืบหน้า: ซ่อมไปแล้ว 3 เครื่อง เหลืออีก 1 เครื่อง จะเสร็จพรุ่งนี้ @RUBYSHOP Sale. (New)', '2025-05-18 21:01:29'),
(39, 'Ud580f5646afc4193eb680477e21ceebe', '#newtask งานรายวัน เดือนพฤษภาคม 2568:  เดี่ยว ไมค์ เก้า โก้  บัวขาว กัน โดม เป้ง\n-ไมค์ โก้ บัวขาว กัน ขนของขึ้นรถตู้ขาว\n-ไมค์ โก้ ติดจอ บ้าน 81\n-บัวขาว เก้า ฺโดม เป้ง ช่วยขนย้ายม้าหินอ่อน ไปไว้หลังบ้าน 9\n-โก้ กัน เดินสายไฟบนบ้าน 9 ต่อ\n-โดม เป้ง ย้าย สายดินใหม่บ้าน 9\n-เก้า เป้ง เชื่อมประตูเลื่อนและใส่ล้อใหม่\n-ไมค์  บัวขาว ย้ายตู้แอร์ คอมแอร์ และท่อแอร์ จากบ้าน 25-26มาไว้บ้าน9\n-เดี่ยว ขับรถส่งของให้ ผรม.โซบ้านนครปฐม\nของที่นำขึ้นรถตู้ขาว \n1.อิฐมูลเบา 3 เลท\n2.กระบะผสมปูน ใหญ่ 1\n3.สายน้ำ1 เส้น\n4.เครื่องชาร์จแบตแมคโคร 1 เครื่อง\n5เครื่องปั่นปูน ไม่ใช้ (นำกลับบนรถตู้ขาว)\n6.กระแป๋ง 3 อัน\n7.พรั่วปลายแหลม,กะปลายตัดอย่างละ 1 อัน\n8เกียงสี่เหลี่ยมฉาบปูน2อัน', 'newtask', 'งานรายวัน เดือนพฤษภาคม 2568:  เดี่ยว ไมค์ เก้า โก้  บัวขาว กัน โดม เป้ง\n-ไมค์ โก้ บัวขาว กัน ขนของขึ้นรถตู้ขาว\n-ไมค์ โก้ ติดจอ บ้าน 81\n-บัวขาว เก้า ฺโดม เป้ง ช่วยขนย้ายม้าหินอ่อน ไปไว้หลังบ้าน 9\n-โก้ กัน เดินสายไฟบนบ้าน 9 ต่อ\n-โดม เป้ง ย้าย สายดินใหม่บ้าน 9\n-เก้า เป้ง เชื่อมประตูเลื่อนและใส่ล้อใหม่\n-ไมค์  บัวขาว ย้ายตู้แอร์ คอมแอร์ และท่อแอร์ จากบ้าน 25-26มาไว้บ้าน9\n-เดี่ยว ขับรถส่งของให้ ผรม.โซบ้านนครปฐม\nของที่นำขึ้นรถตู้ขาว \n1.อิฐมูลเบา 3 เลท\n2.กระบะผสมปูน ใหญ่ 1\n3.สายน้ำ1 เส้น\n4.เครื่องชาร์จแบตแมคโคร 1 เครื่อง\n5เครื่องปั่นปูน ไม่ใช้ (นำกลับบนรถตู้ขาว)\n6.กระแป๋ง 3 อัน\n7.พรั่วปลายแหลม,กะปลายตัดอย่างละ 1 อัน\n8เกียงสี่เหลี่ยมฉาบปูน2อัน', '2025-05-18 21:24:33'),
(40, 'Ud580f5646afc4193eb680477e21ceebe', '#newtask งานรายวัน เดือนพฤษภาคม 2568:  เดี่ยว ไมค์ เก้า โก้  บัวขาว กัน โดม เป้ง:\n-ไมค์ โก้ บัวขาว กัน ขนของขึ้นรถตู้ขาว\n-ไมค์ โก้ ติดจอ บ้าน 81\n-บัวขาว เก้า ฺโดม เป้ง ช่วยขนย้ายม้าหินอ่อน ไปไว้หลังบ้าน 9\n-โก้ กัน เดินสายไฟบนบ้าน 9 ต่อ\n-โดม เป้ง ย้าย สายดินใหม่บ้าน 9\n-เก้า เป้ง เชื่อมประตูเลื่อนและใส่ล้อใหม่\n-ไมค์  บัวขาว ย้ายตู้แอร์ คอมแอร์ และท่อแอร์ จากบ้าน 25-26มาไว้บ้าน9\n-เดี่ยว ขับรถส่งของให้ ผรม.โซบ้านนครปฐม\nของที่นำขึ้นรถตู้ขาว \n1.อิฐมูลเบา 3 เลท\n2.กระบะผสมปูน ใหญ่ 1\n3.สายน้ำ1 เส้น\n4.เครื่องชาร์จแบตแมคโคร 1 เครื่อง\n5เครื่องปั่นปูน ไม่ใช้ (นำกลับบนรถตู้ขาว)\n6.กระแป๋ง 3 อัน\n7.พรั่วปลายแหลม,กะปลายตัดอย่างละ 1 อัน\n8เกียงสี่เหลี่ยมฉาบปูน2อัน', 'newtask', 'งานรายวัน เดือนพฤษภาคม 2568:  เดี่ยว ไมค์ เก้า โก้  บัวขาว กัน โดม เป้ง:\n-ไมค์ โก้ บัวขาว กัน ขนของขึ้นรถตู้ขาว\n-ไมค์ โก้ ติดจอ บ้าน 81\n-บัวขาว เก้า ฺโดม เป้ง ช่วยขนย้ายม้าหินอ่อน ไปไว้หลังบ้าน 9\n-โก้ กัน เดินสายไฟบนบ้าน 9 ต่อ\n-โดม เป้ง ย้าย สายดินใหม่บ้าน 9\n-เก้า เป้ง เชื่อมประตูเลื่อนและใส่ล้อใหม่\n-ไมค์  บัวขาว ย้ายตู้แอร์ คอมแอร์ และท่อแอร์ จากบ้าน 25-26มาไว้บ้าน9\n-เดี่ยว ขับรถส่งของให้ ผรม.โซบ้านนครปฐม\nของที่นำขึ้นรถตู้ขาว \n1.อิฐมูลเบา 3 เลท\n2.กระบะผสมปูน ใหญ่ 1\n3.สายน้ำ1 เส้น\n4.เครื่องชาร์จแบตแมคโคร 1 เครื่อง\n5เครื่องปั่นปูน ไม่ใช้ (นำกลับบนรถตู้ขาว)\n6.กระแป๋ง 3 อัน\n7.พรั่วปลายแหลม,กะปลายตัดอย่างละ 1 อัน\n8เกียงสี่เหลี่ยมฉาบปูน2อัน', '2025-05-18 21:25:09'),
(41, 'Ud580f5646afc4193eb680477e21ceebe', '#create newwork', 'create', 'newwork', '2025-05-18 22:10:04'),
(42, 'Ud580f5646afc4193eb680477e21ceebe', '#many งานรายวัน: web developer 101 @RUBYSHOP Sale. (New) Sale. (New)  sell 899 sell999 sell sell M6 sell M30l sell 70L', 'many', 'งานรายวัน: web developer 101 @RUBYSHOP Sale. (New) Sale. (New)  sell 899 sell999 sell sell M6 sell M30l sell 70L', '2025-05-18 22:54:20'),
(43, 'Ud580f5646afc4193eb680477e21ceebe', '#findmore', 'findmore', '', '2025-05-18 22:55:06'),
(44, 'Ud580f5646afc4193eb680477e21ceebe', '#findall', 'findall', '', '2025-05-18 22:55:18'),
(45, 'Ud580f5646afc4193eb680477e21ceebe', '#create newprojects101: line bot', 'create', 'newprojects101: line bot', '2025-05-18 22:55:41'),
(46, 'Ud580f5646afc4193eb680477e21ceebe', '#update', 'update', '', '2025-05-18 22:58:29'),
(47, 'Ud580f5646afc4193eb680477e21ceebe', '#create ', 'create', '', '2025-05-18 22:58:52'),
(48, 'Ud580f5646afc4193eb680477e21ceebe', '#delete', 'delete', '', '2025-05-18 22:59:27'),
(49, 'Ud580f5646afc4193eb680477e21ceebe', '#update ติตตั้งประตูห้องน้ำชั้น2 ของพี่อ็อฟ บ้าน 81 : well done', 'update', 'ติตตั้งประตูห้องน้ำชั้น2 ของพี่อ็อฟ บ้าน 81 : well done', '2025-05-18 23:00:20'),
(50, 'Ud580f5646afc4193eb680477e21ceebe', '#hi', 'hi', '', '2025-05-18 23:17:36'),
(51, 'Ud580f5646afc4193eb680477e21ceebe', '#hi', 'hi', '', '2025-05-18 23:27:40'),
(52, 'Ud580f5646afc4193eb680477e21ceebe', '#hi', 'hi', '', '2025-05-18 23:31:01'),
(53, 'Ud580f5646afc4193eb680477e21ceebe', '#hi', 'hi', '', '2025-05-18 23:36:07'),
(54, 'Ud580f5646afc4193eb680477e21ceebe', '#hi', 'hi', '', '2025-05-18 23:37:34'),
(55, 'Ud580f5646afc4193eb680477e21ceebe', '#hi', 'hi', '', '2025-05-18 23:38:22'),
(56, 'Ud580f5646afc4193eb680477e21ceebe', '#hi', 'hi', '', '2025-05-18 23:39:22'),
(57, 'Ud580f5646afc4193eb680477e21ceebe', '#create ssd', 'create', 'ssd', '2025-05-19 08:56:47'),
(58, 'Ud580f5646afc4193eb680477e21ceebe', '#newtask sss#ssr @RUBYSHOP Sale. (New) @Rubyshop lek ', 'newtask', 'sss#ssr @RUBYSHOP Sale. (New) @Rubyshop lek', '2025-05-19 08:57:43'),
(59, 'Ud580f5646afc4193eb680477e21ceebe', '#newtask sss:ssr @Rubyshop lek @RUBYSHOP Sale. (New) ', 'newtask', 'sss:ssr @Rubyshop lek @RUBYSHOP Sale. (New)', '2025-05-19 08:58:22'),
(60, 'Ud580f5646afc4193eb680477e21ceebe', '#newtask newproject101:Forrest:isok @RUBYSHOP Sale. (New) @Rubyshop lek ', 'newtask', 'newproject101:Forrest:isok @RUBYSHOP Sale. (New) @Rubyshop lek', '2025-05-19 08:59:20'),
(61, 'Ud580f5646afc4193eb680477e21ceebe', '#create test101: testfirst101', 'create', 'test101: testfirst101', '2025-05-19 09:00:51'),
(62, 'Ud580f5646afc4193eb680477e21ceebe', '#newtask test101:newtask to day: description @RUBYSHOP Sale. (New) @Rubyshop lek ', 'newtask', 'test101:newtask to day: description @RUBYSHOP Sale. (New) @Rubyshop lek', '2025-05-19 09:01:44'),
(63, 'Ud580f5646afc4193eb680477e21ceebe', '#newtask test101:workdaily: buy new shoe: @RUBYSHOP Sale. (New) @Rubyshop lek ', 'newtask', 'test101:workdaily: buy new shoe: @RUBYSHOP Sale. (New) @Rubyshop lek', '2025-05-19 09:03:13');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `line_messages`
--
ALTER TABLE `line_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `line_messages`
--
ALTER TABLE `line_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

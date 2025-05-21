-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 19, 2025 at 09:17 AM
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
-- Table structure for table `user_mappings`
--

CREATE TABLE `user_mappings` (
  `id` int(11) NOT NULL,
  `line_user_id` varchar(255) NOT NULL,
  `line_display_name` varchar(255) NOT NULL,
  `nick_name` varchar(100) DEFAULT NULL,
  `duty_role` varchar(100) DEFAULT NULL,
  `rise_user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `user_mappings`
--

INSERT INTO `user_mappings` (`id`, `line_user_id`, `line_display_name`, `nick_name`, `duty_role`, `rise_user_id`, `created_at`, `updated_at`) VALUES
(6, 'U2ecc26052e4091fb0a68839a96e061ac', 'RUBYSHOP Sale. (New) ', 'นุ้ย', NULL, 6, '2025-05-18 09:05:19', '2025-05-18 09:14:40'),
(22, 'Ud580f5646afc4193eb680477e21ceebe', 'P’Rrin', 'Dev-Admin', NULL, 22, '2025-05-18 06:27:02', '2025-05-18 09:57:58'),
(26, 'Ud5fc1f611437c15ef91b8d70d8f411c8', 'Unknown User', NULL, NULL, 4, '2025-05-19 01:36:19', '2025-05-19 01:54:10');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `user_mappings`
--
ALTER TABLE `user_mappings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `line_user_id` (`line_user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `user_mappings`
--
ALTER TABLE `user_mappings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

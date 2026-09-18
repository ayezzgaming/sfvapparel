'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Play,
  Plus,
  ChevronRight, 
  ShieldCheck,
  Truck,
  Clock,
  CheckCircle2,
  Quote
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';

interface ProductDetail {
  id: string;
  category: string;
  title: string;
  headline: string;
  highlight: string;
  price: string;
  pricePrefix?: string;
  priceAmount?: string;
  priceUnit?: string;
  image: string;
  href: string;
  details: {
    title: string;
    description: string;
  }[];
}

interface StepDetail {
  step: string;
  title: string;
  desc: string;
  detailTitle: string;
  detailDesc: string;
  points: string[];
}

interface ProductionVideo {
  id: string;
  category: string;
  title: string;
  thumbnail: string;
  youtubeId: string;
}

interface TestimonialItem {
  id: string;
  name: string;
  location: string;
  initial: string;
  avatarBg: string;
  avatarText: string;
  platform: 'google' | 'tiktok' | 'facebook' | 'instagram';
  rating: number;
  review: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'testi-1',
    name: 'Ahmad Faizal',
    location: 'Kuala Lumpur',
    initial: 'A',
    avatarBg: 'bg-blue-100',
    avatarText: 'text-blue-600',
    platform: 'google',
    rating: 5,
    review: '"Baju sampai cepat, design cantik & kain berkualiti! Dah order 3 kali untuk team futsal, terus repeat order. Servis memang padu."',
  },
  {
    id: 'testi-2',
    name: 'Nurul Izzah',
    location: 'Shah Alam',
    initial: 'N',
    avatarBg: 'bg-rose-100',
    avatarText: 'text-rose-600',
    platform: 'tiktok',
    rating: 5,
    review: '"Sublimasi jersi netball sekolah kami memang meletop warna dia! Halus gila printing, cikgu dan student semua puas hati."',
  },
  {
    id: 'testi-3',
    name: 'Hafizuddin Radzi',
    location: 'Johor Bahru',
    initial: 'H',
    avatarBg: 'bg-blue-100',
    avatarText: 'text-blue-700',
    platform: 'facebook',
    rating: 5,
    review: '"Tempah baju polo sulam kolar untuk 50 staf syarikat. Jahitan sulam logo tajam sangat, material sejuk sedap pakai pergi event."',
  },
  {
    id: 'testi-4',
    name: 'Danial Hakim',
    location: 'Pulau Pinang',
    initial: 'D',
    avatarBg: 'bg-amber-100',
    avatarText: 'text-amber-600',
    platform: 'instagram',
    rating: 5,
    review: '"DTF print baju event running kelab kami tak tanggal lepas banyak kali basuh. Kualiti memang terbaik, penghantaran 4 hari dah sampai."',
  },
];

const renderPlatformIcon = (platform: TestimonialItem['platform']) => {
  switch (platform) {
    case 'google':
      return (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.02 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="12" cy="12" r="12" fill="#000000"/>
          <path d="M16.5 8.5a3.5 3.5 0 0 1-2.5-2.5V5h-2v9a2 2 0 1 1-2-2c.3 0 .6.1.8.2V10a4 4 0 1 0 3.2 3.9V9.2a5.5 5.5 0 0 0 2.5.8V8.5z" fill="#FFFFFF"/>
          <path d="M15 7.5a3.5 3.5 0 0 1-1-.5V6h-1v8a2 2 0 1 1-2-2c.2 0 .4 0 .6.1V11a3 3 0 1 0 2.4 2.9V9a4.5 4.5 0 0 0 2 .5V7.5z" fill="#25F4EE"/>
          <path d="M16 8a3.5 3.5 0 0 1-2-.5V7h-1v8a2 2 0 1 1-2-2c.2 0 .4 0 .6.1V11.5a3 3 0 1 0 2.4 2.9V9.5a4.5 4.5 0 0 0 2 .5V8z" fill="#FE2C55"/>
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
          <path d="M16.67 15.543l.532-3.47h-3.328v-2.25c0-.949.465-1.874 1.956-1.874h1.514V4.996s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.643H7.078v3.47h3.047v8.385a12.1 12.1 0 003.875 0v-8.385h2.67z" fill="#FFFFFF"/>
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f09433" />
              <stop offset="25%" stopColor="#e6683c" />
              <stop offset="50%" stopColor="#dc2743" />
              <stop offset="75%" stopColor="#cc2366" />
              <stop offset="100%" stopColor="#bc1888" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill="url(#ig-grad)"/>
          <path d="M12 7.02c-2.75 0-4.98 2.23-4.98 4.98s2.23 4.98 4.98 4.98 4.98-2.23 4.98-4.98-2.23-4.98-4.98-4.98zm0 8.24c-1.8 0-3.26-1.46-3.26-3.26s1.46-3.26 3.26-3.26 3.26 1.46 3.26 3.26-1.46 3.26-3.26 3.26zm6.34-8.42c0 .64-.52 1.16-1.16 1.16-.64 0-1.16-.52-1.16-1.16 0-.64.52-1.16 1.16-1.16.64 0 1.16.52 1.16 1.16zm2.66 1.18c-.06-1.26-.35-2.38-1.27-3.3-.92-.92-2.04-1.21-3.3-1.27C15.15 3.4 11.85 3.4 10.57 3.45c-1.26.06-2.38.35-3.3 1.27-.92.92-1.21 2.04-1.27 3.3C3.95 9.3 3.95 12.6 4 13.88c.06 1.26.35 2.38 1.27 3.3.92.92 2.04 1.21 3.3 1.27 1.28.05 4.58.05 5.86 0 1.26-.06 2.38-.35 3.3-1.27.92-.92 1.21-2.04 1.27-3.3.05-1.28.05-4.58 0-5.86zm-1.88 9.08c-.28.7-.82 1.24-1.52 1.52-1.01.4-3.41.31-4.6.31s-3.59.09-4.6-.31c-.7-.28-1.24-.82-1.52-1.52-.4-1.01-.31-3.41-.31-4.6s-.09-3.59.31-4.6c.28-.7.82-1.24 1.52-1.52 1.01-.4 3.41-.31 4.6-.31s3.59-.09 4.6.31c.7.28 1.24.82 1.52 1.52.4 1.01.31 3.41.31 4.6s.09 3.59-.31 4.6z" fill="#FFFFFF"/>
        </svg>
      );
  }
};

const PRODUCTION_VIDEOS: ProductionVideo[] = [
  {
    id: 'vid-sublimation',
    category: 'Sublimasi Penuh',
    title: 'Cetakan Definisi Tinggi',
    thumbnail: '/images/prod_sportswear.jpg',
    youtubeId: 'LXb3EKWsInQ',
  },
  {
    id: 'vid-dtf',
    category: 'Cetakan DTF',
    title: 'Teknologi Dakwat Jepun',
    thumbnail: '/images/prod_tshirt.jpg',
    youtubeId: 'kJQP7kiw5Fk',
  },
  {
    id: 'vid-embroidery',
    category: 'Sulaman Berkomputer',
    title: 'Ketumpatan Jahitan Tajam',
    thumbnail: '/images/prod_embroidery.jpg',
    youtubeId: '9bZkp7q19f0',
  },
  {
    id: 'vid-merchandise',
    category: 'Cenderamata Syarikat',
    title: 'Kualiti Kemasan Eksekutif',
    thumbnail: '/images/prod_merchandise.jpg',
    youtubeId: '3JZ_D3ELwOQ',
  },
];

const PRODUCTS: ProductDetail[] = [
  {
    id: 'sublimation',
    category: 'Sublimasi Penuh',
    title: 'Jersi Sublimasi',
    headline: 'Corak tanpa batasan untuk kelab sukan anda.',
    highlight: 'Kain DryFit • Warna Kekal',
    price: 'Dari RM28 / helai',
    pricePrefix: 'Bermula',
    priceAmount: 'RM28',
    priceUnit: '/ helai',
    image: '/images/prod_sportswear.jpg',
    href: '/catalog?type=sublimation',
    details: [
      {
        title: 'Ketahanan warna tanpa luntur.',
        description: 'Teknologi cetakan sublimasi haba tinggi menyerap terus ke dalam serat fabrik Microfiber Eyelet. Warna kekal terang, tajam, dan tidak merekah walaupun dibasuh berulang kali.',
      },
      {
        title: 'Kesejukan & pengudaraan optimum.',
        description: 'Fabrik quick-dry berliang mikro direka khas untuk atlet dan sukan lasak. Memastikan penyejukan badan maksimum sepanjang hari.',
      },
      {
        title: 'Kustom sepenuhnya.',
        description: 'Pilihan kolar V-neck, Roundneck, atau Polo dengan cetakan nama dan nombor jersi tanpa had caj tambahan.',
      },
    ],
  },
  {
    id: 'tshirt',
    category: 'Cetakan DTF',
    title: 'Cetakan T-Shirt',
    headline: 'Perincian ultra tajam pada kapas premium.',
    highlight: 'Kapas 100% • Warna Tajam',
    price: 'Dari RM18 / helai',
    pricePrefix: 'Bermula',
    priceAmount: 'RM18',
    priceUnit: '/ helai',
    image: '/images/prod_tshirt.jpg',
    href: '/catalog?type=dtf',
    details: [
      {
        title: 'Hasil cetakan sehalus fotografi.',
        description: 'Menggunakan dakwat DTF gred industri Jepun dengan lapisan serbuk TPU premium, menghasilkan cetakan yang elastik dan lembut disentuh.',
      },
      {
        title: 'Kapas 100% Combed Cotton.',
        description: 'Pilihan baju kapas berkualiti tinggi 190gsm - 220gsm yang selesa, sejuk, dan tahan lasak selepas basuhan.',
      },
      {
        title: 'Tiada had kuantiti minimum.',
        description: 'Sesuai untuk tempahan kumpulan kecil, baju kelas, acara keluarga, mahupun edisi terhad jenama anda.',
      },
    ],
  },
  {
    id: 'merchandise',
    category: 'Cenderamata',
    title: 'Cenderamata',
    headline: 'Hadiah korporat eksklusif berjenama.',
    highlight: 'Lanyard, Beg & Cawan',
    price: 'Pakej Syarikat',
    pricePrefix: 'Katalog',
    priceAmount: 'Pakej Khas',
    priceUnit: 'Korporat',
    image: '/images/prod_merchandise.jpg',
    href: '/catalog?type=merchandise',
    details: [
      {
        title: 'Pelbagai pilihan premium.',
        description: 'Daripada lanyard cetakan penuh, beg tote kanvas, botol tumbler keluli tahan karat, hingga ke payung dan topi korporat.',
      },
      {
        title: 'Penjenamaan profesional.',
        description: 'Kaedah cetakan UV, laser engraving, dan silkscreen presisi tinggi untuk mempamerkan identiti syarikat anda secara elegan.',
      },
    ],
  },
  {
    id: 'embroidery',
    category: 'Sulaman Khas',
    title: 'Sulaman Khas',
    headline: 'Jahitan logo padat standard eksekutif.',
    highlight: 'Logo & Patch Kemas',
    price: 'Sulaman Mesin',
    pricePrefix: 'Sulaman',
    priceAmount: 'Mesin Khas',
    priceUnit: 'Eksekutif',
    image: '/images/prod_embroidery.jpg',
    href: '/catalog?type=embroidery',
    details: [
      {
        title: 'Sulaman berkomputer ketepatan tinggi.',
        description: 'Mesin sulaman berbilang jarum berteknologi Jepun memastikan ketumpatan jahitan logo yang tajam, kukuh, dan tidak terurai.',
      },
      {
        title: 'Sesuai untuk kemeja, jaket & topi.',
        description: 'Pilihan ideal untuk uniform korporat, baju F1, jaket eksekutif, dan topi snapback.',
      },
    ],
  },
];

const ORDER_STEPS: StepDetail[] = [
  {
    step: '01',
    title: 'Pilih Rekaan & Fabrik',
    desc: 'Pilih templat katalog atau muat naik fail rekaan khas anda.',
    detailTitle: 'Langkah 1: Rekaan & Jenis Fabrik',
    detailDesc: 'Pilih mana-mana templat sedia ada dari galeri katalog kami, atau muat naik fail rekaan anda sendiri (AI/PDF). Pereka kami sedia membantu menghasilkan visual awal.',
    points: [
      'Pilihan fabrik Microfiber Mini Eyelet, Interlock, atau Cotton Combed',
      'Penyesuaian warna Pantone & penjenamaan percuma',
      'Pilihan pelbagai jenis kolar (V-Neck, Roundneck, Polo Button)'
    ]
  },
  {
    step: '02',
    title: 'Tetapkan Saiz & Nama',
    desc: 'Senarai pecahan saiz pasukan dari saiz kanak-kanak hingga 7XL.',
    detailTitle: 'Langkah 2: Senarai Nama & Saiz',
    detailDesc: 'Masukkan senarai nama pemain, saiz, dan nombor jersi dengan mudah melalui borang digital atau muat naik fail senarai pasukan anda.',
    points: [
      'Saiz lengkap kanak-kanak (24-32) hingga dewasa (XS-7XL)',
      'Cetakan nama dan nombor jersi percuma tanpa had huruf',
      'Pilihan potongan lengan pendek, lengan panjang, atau Muslimah'
    ]
  },
  {
    step: '03',
    title: 'Pembayaran Downpayment (DP)',
    desc: 'Buat bayaran deposit untuk pengesahan slot produksi kilang.',
    detailTitle: 'Langkah 3: Pembayaran Downpayment (DP)',
    detailDesc: 'Selepas perincian pesanan dipersetujui, buat bayaran deposit (DownPayment) untuk mengesahkan slot pengeluaran kilang serta penyediaan fabrik dan bahan cetakan.',
    points: [
      'Pembayaran selamat melalui FPX Online Banking, DuitNow QR, atau Kad Bank',
      'Invois rasmi dan resit pembayaran digital dijana serta-merta',
      'Baki bayaran hanya perlu dijelaskan setelah jersi siap sebelum urusan pos'
    ]
  },
  {
    step: '04',
    title: 'Pengeluaran & Pos Pantas',
    desc: 'Pesanan diproses kilang, lulus QC dan dihantar terus kepada anda.',
    detailTitle: 'Langkah 4: Pengeluaran Kilang & Penghantaran',
    detailDesc: 'Pesanan anda terus memasuki barisan cetakan dan jahitan kilang berteknologi tinggi, melalui semakan kualiti (QC) rapi sebelum dipos terus ke alamat anda.',
    points: [
      'Tempoh siap standard 5 hingga 9 hari bekerja',
      'Pemeriksaan kualiti setiap helai pakaian (QC Pass)',
      'Nombor penjejakan kurier (tracking number) masa nyata disediakan'
    ]
  },
];

interface StepDetail {
  step: string;
  title: string;
  desc: string;
  detailTitle: string;
  detailDesc: string;
  points: string[];
}

interface PolicyModalContent {
  id: 'privacy' | 'terms' | 'warranty' | 'shipping';
  badge: string;
  title: string;
  description: string;
  sections: {
    heading: string;
    text: string;
  }[];
}

const POLICIES: Record<string, PolicyModalContent> = {
  privacy: {
    id: 'privacy',
    badge: 'Dasar Privasi',
    title: 'Dasar Privasi & Perlindungan Data (PDPA)',
    description: 'SFV Apparel komited untuk melindungi keselamatan dan kerahsiaan data peribadi anda selaras dengan Akta Perlindungan Data Peribadi 2010 (PDPA).',
    sections: [
      {
        heading: '1. Pengumpulan Maklumat',
        text: 'Kami hanya mengumpul maklumat yang diperlukan untuk memproses pesanan anda seperti nama, nombor telefon, alamat penghantaran, serta senarai nama & saiz pakaian.',
      },
      {
        heading: '2. Penggunaan Data Pesanan',
        text: 'Data yang dikumpul digunakan khusus untuk penghasilan mockup, pencetakan jersi, pengurusan logistik pos kurier, dan pengemaskinian status pesanan anda.',
      },
      {
        heading: '3. Kerahsiaan & Keselamatan',
        text: 'Kami tidak akan sekali-kali menjual, menyewa, atau berkongsi data peribadi anda kepada pihak ketiga yang tidak berkaitan tanpa kebenaran bertulis anda.',
      },
      {
        heading: '4. Kuki (Cookies) & Teknologi Analitik',
        text: 'Tapak web kami menggunakan kuki dan teknologi berkaitan untuk mengekalkan keutamaan sesi dan meningkatkan kestabilan pengalaman aplikasi.',
      },
    ],
  },
  terms: {
    id: 'terms',
    badge: 'Terma & Syarat',
    title: 'Terma & Syarat Perkhidmatan Tempahan',
    description: 'Sila baca terma perkhidmatan berikut sebelum mengesahkan sebarang tempahan rasmi bersama SFV Apparel.',
    sections: [
      {
        heading: '1. Pengesahan Mockup Visual',
        text: 'Pelanggan bertanggungjawab untuk menyemak dengan teliti semua ejaan nama, nombor jersi, kedudukan logo penaja, dan padanan saiz dalam fail visual akhir sebelum memberi kelulusan cetakan.',
      },
      {
        heading: '2. Deposit & Pembayaran',
        text: 'Produksi kilang hanya akan dimulakan setelah deposit tempahan yang dipersetujui disahkan diterima oleh akaun rasmi SFV Ventures Marketing.',
      },
      {
        heading: '3. Pindaan Selepas Cetakan',
        text: 'Sebarang pindaan pada rekaan atau senarai saiz selepas proses cetakan bermula mungkin akan dikenakan caj kos pengeluaran semula.',
      },
      {
        heading: '4. Hak Cipta Reka Bentuk',
        text: 'Pelanggan menjamin bahawa semua logo dan imej yang dibekalkan untuk dicetak adalah hak milik sah atau mempunyai permit/kebenaran penggunaan yang sah.',
      },
    ],
  },
  warranty: {
    id: 'warranty',
    badge: 'Jaminan Kualiti',
    title: 'Polisi Jaminan & Pemulangan (1-to-1 Replacement)',
    description: 'Kami memberi keutamaan penuh kepada kepuasan pelanggan dengan prosedur kawalan kualiti (QC) berstandard tinggi.',
    sections: [
      {
        heading: '1. Jaminan Kualiti Fabrik & Cetakan',
        text: 'Kami menjamin cetakan warna jersi sublimasi penuh adalah tajam, tidak luntur, dan jahitan kemas berstandard sukan profesional.',
      },
      {
        heading: '2. Gantian 1-ke-1 (Defect Replacement)',
        text: 'Sekiranya terdapat kecacatan ketara akibat kesilapan kilang kami (seperti tersalah saiz dari senarai disahkan atau kerosakan fabrik), kami akan menggantikan item tersebut 1-ke-1 secara percuma.',
      },
      {
        heading: '3. Tempoh Laporan Kecacatan',
        text: 'Sebarang tuntutan kecacatan hendaklah dilaporkan kepada pihak khidmat pelanggan kami dalam tempoh 7 hari selepas bungkusan pesanan diterima.',
      },
    ],
  },
  shipping: {
    id: 'shipping',
    badge: 'Polisi Penghantaran',
    title: 'Dasar Penghantaran & Tempoh Pengeluaran',
    description: 'Maklumat berkaitan tempoh siap, pembungkusan rapi, dan kaedah penghantaran ke seluruh Malaysia & Singapura.',
    sections: [
      {
        heading: '1. Tempoh Siap Pengeluaran',
        text: 'Tempoh siap piawai kilang adalah 5 hingga 9 hari bekerja selepas reka bentuk mockup diluluskan secara rasmi oleh pelanggan.',
      },
      {
        heading: '2. Rakan Kurier Rasmi',
        text: 'Penghantaran dibuat menggunakan rakan kurier dipercayai seperti PosLaju, J&T Express, dan NinjaVan dengan nombor penjejakan (tracking number) masa nyata.',
      },
      {
        heading: '3. Kawasan Liputan Penghantaran',
        text: 'Kami menyediakan perkhidmatan penghantaran pantas ke seluruh Semenanjung Malaysia, Sabah, Sarawak, Labuan, dan Singapura.',
      },
    ],
  },
};

interface ProductionGalleryItem {
  id: string;
  title: string;
  category: string;
  fabric: string;
  image: string;
  client: string;
  tag: string;
}

const PRODUCTION_GALLERY: ProductionGalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Jersi Bola Sepak Harimau FC',
    category: 'Sublimasi Penuh',
    fabric: 'Drifit Milano 165 GSM • Kolar V-Pro',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&auto=format&fit=crop&q=80',
    client: '50 helai • FC Harimau Selangor',
    tag: 'Full Sublimation',
  },
  {
    id: 'gal-2',
    title: 'Jersi E-Sports Valkyrie Cyber',
    category: 'Sublimasi Penuh HD',
    fabric: 'Microfiber Smooth • Potongan Raglan',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=80',
    client: '25 helai • Valkyrie MY E-Sports',
    tag: 'Esports Pro',
  },
  {
    id: 'gal-3',
    title: 'Baju T-Shirt Streetwear Neo-Tokyo',
    category: 'Cetakan DTF HD',
    fabric: 'Heavyweight Cotton 24s • Saiz Cetak A3',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1000&auto=format&fit=crop&q=80',
    client: '80 helai • Neo Apparel Store',
    tag: 'DTF Transfer',
  },
  {
    id: 'gal-4',
    title: 'Jersi Larian AeroFlow Marathon',
    category: 'Sublimasi Penuh',
    fabric: 'Poly-Mesh Honeycomb • Ultra Breathable',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1000&auto=format&fit=crop&q=80',
    client: '120 helai • KL Running Squad',
    tag: 'Running Kit',
  },
  {
    id: 'gal-5',
    title: 'Hoodie Fleece Heavyweight Glitch',
    category: 'DTF Elastomeric',
    fabric: 'Cotton Fleece 320 GSM • Cetakan Belakang Jumbo A2',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1000&auto=format&fit=crop&q=80',
    client: '35 helai • Glitch Society KL',
    tag: 'Heavy Hoodie',
  },
  {
    id: 'gal-6',
    title: 'Baju Polo Pique Kelab Korporat',
    category: 'Sublimasi & DTF',
    fabric: 'Pique Poly-Blend • Kolar Butang & Lencana Dada',
    image: 'https://images.unsplash.com/photo-1625910513413-7a718797f1df?w=1000&auto=format&fit=crop&q=80',
    client: '60 helai • Apex Engineering',
    tag: 'Corporate Polo',
  },
];

export default function HomePage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail>(PRODUCTS[0]);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);

  const [selectedStep, setSelectedStep] = useState<StepDetail>(ORDER_STEPS[0]);
  const [isStepSheetOpen, setIsStepSheetOpen] = useState(false);

  const [selectedPolicy, setSelectedPolicy] = useState<PolicyModalContent>(POLICIES.privacy);
  const [isPolicySheetOpen, setIsPolicySheetOpen] = useState(false);

  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  // Production Gallery Auto-Swap State & Ref
  const galleryScrollRef = useRef<HTMLDivElement>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [isGalleryPaused, setIsGalleryPaused] = useState(false);

  // Testimonial Auto-Swap State & Ref
  const testimonialScrollRef = useRef<HTMLDivElement>(null);
  const [activeTestiIndex, setActiveTestiIndex] = useState(0);
  const [isTestiPaused, setIsTestiPaused] = useState(false);

  // Production Gallery Auto-Swap Timer (moves smoothly every 3.8 seconds)
  useEffect(() => {
    if (isGalleryPaused) return;

    const interval = setInterval(() => {
      if (!galleryScrollRef.current) return;
      const container = galleryScrollRef.current;
      const nextIndex = (activeGalleryIndex + 1) % PRODUCTION_GALLERY.length;
      const child = container.children[nextIndex] as HTMLElement;
      if (child) {
        const scrollLeft = child.offsetLeft - (container.clientWidth - child.offsetWidth) / 2;
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
      }
      setActiveGalleryIndex(nextIndex);
    }, 3800);

    return () => clearInterval(interval);
  }, [isGalleryPaused, activeGalleryIndex]);

  const scrollToGallery = (index: number) => {
    if (!galleryScrollRef.current) return;
    const container = galleryScrollRef.current;
    const child = container.children[index] as HTMLElement;
    if (child) {
      const scrollLeft = child.offsetLeft - (container.clientWidth - child.offsetWidth) / 2;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
    setActiveGalleryIndex(index);
  };

  const handleGalleryScroll = () => {
    if (!galleryScrollRef.current) return;
    const container = galleryScrollRef.current;
    const scrollCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    Array.from(container.children).forEach((child, index) => {
      const el = child as HTMLElement;
      const childCenter = el.offsetLeft + el.offsetWidth / 2;
      const distance = Math.abs(scrollCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeGalleryIndex) {
      setActiveGalleryIndex(closestIndex);
    }
  };

  // Testimonial Auto-Swap Timer (Smoothly moves every 4.2 seconds)
  useEffect(() => {
    if (isTestiPaused) return;

    const interval = setInterval(() => {
      if (!testimonialScrollRef.current) return;
      const container = testimonialScrollRef.current;
      const nextIndex = (activeTestiIndex + 1) % TESTIMONIALS.length;
      const child = container.children[nextIndex] as HTMLElement;
      if (child) {
        const scrollLeft = child.offsetLeft - (container.clientWidth - child.offsetWidth) / 2;
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
      }
      setActiveTestiIndex(nextIndex);
    }, 4200);

    return () => clearInterval(interval);
  }, [isTestiPaused, activeTestiIndex]);

  const scrollToTestimonial = (index: number) => {
    if (!testimonialScrollRef.current) return;
    const container = testimonialScrollRef.current;
    const child = container.children[index] as HTMLElement;
    if (child) {
      const scrollLeft = child.offsetLeft - (container.clientWidth - child.offsetWidth) / 2;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
    setActiveTestiIndex(index);
  };

  const handleTestiScroll = () => {
    if (!testimonialScrollRef.current) return;
    const container = testimonialScrollRef.current;
    const scrollCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    Array.from(container.children).forEach((child, index) => {
      const el = child as HTMLElement;
      const childCenter = el.offsetLeft + el.offsetWidth / 2;
      const distance = Math.abs(scrollCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeTestiIndex) {
      setActiveTestiIndex(closestIndex);
    }
  };

  const handleOpenProduct = (product: ProductDetail) => {
    setSelectedProduct(product);
    setIsProductSheetOpen(true);
  };

  const handleOpenStep = (step: StepDetail) => {
    setSelectedStep(step);
    setIsStepSheetOpen(true);
  };

  const handleOpenPolicy = (policyKey: keyof typeof POLICIES) => {
    setSelectedPolicy(POLICIES[policyKey]);
    setIsPolicySheetOpen(true);
  };

  return (
    <div className="w-full select-none font-ios">
      {/* =========================================================================
          SECTION 1: HERO & PILIHAN SERVIS (iOS Canvas Tint - Kad Putih Timbul & Jelas)
         ========================================================================= */}
      <div className="w-full bg-[#F2F2F7] pt-3 pb-8 px-4 space-y-6">
        {/* 1. HERO SECTION (Bright, Natural Editorial Card - No Border, Natural Daylight) */}
        <div className="relative w-full h-[240px] rounded-3xl overflow-hidden shadow-md shadow-slate-300/40 group">
          {/* Full-bleed Natural Photo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero1.png"
            alt="SFV Apparel Flagship"
            className="w-full h-full object-cover object-[center_22%] group-hover:scale-103 transition-transform duration-700"
          />

          {/* Clean Subtle Bottom-Only Gradient (Leaves sky, face, and daylight completely bright) */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

          {/* Top Status Pill (Compact & Minimalist) */}
          <div className="absolute top-3.5 left-3.5 z-10">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md text-white shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10.5px] font-medium tracking-wide text-white/95">
                Kilang Beroperasi
              </span>
            </div>
          </div>

          {/* Bottom Content Directly Over Gradient (Clean & Crisp) */}
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between z-10">
            <div className="space-y-0.5 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block font-semibold">
                Koleksi Rasmi 2026
              </span>
              <h1 className="text-[17px] font-bold text-white tracking-tight leading-tight drop-shadow-xs">
                Studio Jersi & DTF
              </h1>
            </div>

            {/* Apple Action Capsule */}
            <Link
              href="/catalog"
              className="px-4 py-2 rounded-full bg-white hover:bg-slate-100 active:scale-95 text-slate-900 text-xs font-semibold tracking-tight shadow-md transition-all flex items-center space-x-1 shrink-0"
            >
              <span>Katalog</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
            </Link>
          </div>
        </div>

        {/* 2. PILIHAN SERVIS HEADER & CARDS */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Pilihan Servis
              </h2>
              <p className="text-xs text-slate-500 font-normal tracking-wide mt-0.5">
                Cetakan & jahitan pakaian kustom terus dari kilang
              </p>
            </div>

            <Link
              href="/catalog"
              aria-label="Lihat Semua Servis"
              className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-slate-700 hover:text-[#0052FF] flex items-center justify-center transition-all active:scale-90 shadow-sm border border-black/[0.04]"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.2]" />
            </Link>
          </div>

          {/* Card Produk (Timbul Jelas di atas Background #F2F2F7) */}
          <div className="flex items-stretch gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-4 scroll-pr-4 scrollbar-none no-scrollbar -mx-4 px-4 pt-1 pb-4">
            {PRODUCTS.map((item) => (
              /* Pembungkus Utama: Putih Solid, Border Rapi & Bayang Kontras */
              <div
                key={item.id}
                onClick={() => handleOpenProduct(item)}
                className="rounded-3xl overflow-hidden bg-white w-[235px] flex-shrink-0 snap-start border border-black/[0.07] shadow-md shadow-slate-300/40 cursor-pointer select-none active:scale-[0.98] hover:shadow-lg transition-all flex flex-col justify-between"
              >
                {/* Bagian Gambar: Menempel sempurna ke tepi */}
                <div className="relative w-full h-48 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Bagian Konten: Padding HANYA diletakkan di sini */}
                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="font-bold text-[17px] text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-slate-500 text-[13px] mt-1 line-clamp-1">
                      {item.highlight}
                    </p>
                  </div>

                  {/* Baris Harga & Tombol Interaktif */}
                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0052FF]">
                        {item.pricePrefix || 'Bermula'}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[17px] font-black text-slate-900 tracking-tight leading-none">
                          {item.priceAmount || item.price}
                        </span>
                        {item.priceUnit && (
                          <span className="text-[11px] font-medium text-slate-400">
                            {item.priceUnit}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProduct(item);
                      }}
                      aria-label={`Pilih ${item.title}`}
                      className="w-9 h-9 rounded-full bg-blue-50 hover:bg-[#0052FF] text-[#0052FF] hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-xs border border-blue-100"
                    >
                      <Plus className="w-5 h-5 stroke-[2.2]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: CARA TEMPAHAN & INFO (Soft Ice-Blue Tint - Elegan, Sejuk & Selesa Mata)
         ========================================================================= */}
      <div className="w-full bg-gradient-to-b from-[#F2F6FE] to-[#F8FAFC] pt-8 pb-10 px-4 space-y-5 border-y border-blue-100/60">
        {/* Header Cara Tempahan */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cara Tempahan</h2>
            <p className="text-xs text-slate-500 mt-0.5">4 langkah ringkas untuk memulakan pesanan anda</p>
          </div>
        </div>

        {/* Inset Grouped List (Clean White Card dengan Border Halus) */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-blue-900/5 border border-blue-100/70">
          {ORDER_STEPS.map((item, idx) => {
            const isLast = idx === ORDER_STEPS.length - 1;
            return (
              /* Baris Item dengan Hover Interaktif & Micro-Animation */
              <div
                key={item.step}
                onClick={() => handleOpenStep(item)}
                className="group flex items-center pl-3.5 bg-white hover:bg-blue-50/40 active:bg-blue-50/70 transition-all duration-200 cursor-pointer select-none"
              >
                {/* LEADING ICON (Proporsional & Kemas) */}
                <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-50 group-hover:bg-[#0052FF] group-hover:text-white group-hover:scale-105 group-hover:shadow-sm group-hover:shadow-blue-500/20 flex items-center justify-center text-[#0052FF] font-bold text-xs transition-all duration-200">
                  {item.step}
                </div>

                {/* KONTEN TEKS & PEMISAH */}
                <div className={`flex-1 ml-3 py-3.5 pr-3.5 ${!isLast ? 'border-b border-gray-100' : ''} flex items-center justify-between min-w-0`}>
                  <div className="min-w-0 pr-2">
                    <h3 className="text-[13.5px] font-semibold text-slate-900 group-hover:text-[#0052FF] leading-snug truncate transition-colors duration-200">
                      {item.title}
                    </h3>
                    <p className="text-[11.5px] text-slate-500 mt-0.5 line-clamp-1 leading-normal">
                      {item.desc}
                    </p>
                  </div>

                  {/* CHEVRON */}
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0052FF] group-hover:translate-x-0.5 shrink-0 ml-1.5 transition-all duration-200" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Kotak Info Bawah (Card Putih 3 Kolum Seimbang) */}
        <div className="bg-white rounded-2xl py-2.5 px-2.5 grid grid-cols-3 gap-1.5 items-center shadow-sm shadow-blue-900/5 border border-blue-100/70">
          <div className="flex items-center justify-center gap-1.5 text-[#0052FF] font-semibold text-[11px] py-1.5 px-1 rounded-xl bg-blue-50/70 group cursor-default min-w-0">
            <Clock className="w-3.5 h-3.5 text-[#0052FF] shrink-0" />
            <span className="truncate">5 - 9 Hari</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-semibold text-[11px] py-1.5 px-1 rounded-xl bg-emerald-50/70 group cursor-default min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Jaminan Kilang</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-slate-700 font-semibold text-[11px] py-1.5 px-1 rounded-xl bg-slate-100/80 group cursor-default min-w-0">
            <Truck className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="truncate">Pos Seluruh MY</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          QUOTE / SLOGAN CARD: ANDA BAYANGKAN, KAMI JADIKAN REALITI
         ========================================================================= */}
      <div className="w-full bg-white pt-6 pb-2 px-4">
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0052FF] via-[#0044D6] to-[#0A1847] p-5 sm:p-6 text-white shadow-lg shadow-blue-600/20 border border-blue-400/25">
          {/* Subtle Glassmorphism Ambient Glows */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />
          <Quote className="absolute top-4 right-4 w-12 h-12 text-white/10 rotate-180 pointer-events-none" />

          <div className="relative z-10 space-y-3">
            {/* Main Headline Slogan */}
            <h3 className="text-[19px] sm:text-[21px] font-extrabold text-white tracking-tight leading-snug">
              Anda bayangkan, <br />
              <span className="text-blue-200 underline decoration-blue-300/40 underline-offset-4">
                Kami Jadikan Realiti.
              </span>
            </h3>

            {/* Sub-headline & Description */}
            <div className="space-y-1.5 pt-1.5 border-t border-white/15">
              <p className="text-xs sm:text-[13px] font-bold text-white/95 tracking-tight">
                Anda Design atau sekadar lakaran?
              </p>
              <p className="text-[11.5px] sm:text-xs text-blue-100/90 leading-relaxed font-normal">
                Hantar kepada kami. Kami bantu ubah idea anda menjadi baju sublimation yang nampak WOW dan menepati citarasa anda.
              </p>
            </div>

            {/* Interactive WhatsApp Action */}
            <div className="pt-1.5">
              <a
                href="https://wa.me/60148599138?text=Hai%20SFV%20Apparel,%20saya%20ada%20lakaran/idea%20rekaan%20baju%20yang%20ingin%20dijadikan%20realiti."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0052FF] hover:bg-blue-50 font-bold text-xs shadow-md shadow-black/10 active:scale-95 transition-all"
              >
                <FaWhatsapp className="w-4 h-4 text-[#25D366]" />
                <span>Hantar Idea / Lakaran Sekarang →</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: PROSES PRODUKSI (Latar Putih Bersih - Video Portrait Reel Swipe)
         ========================================================================= */}
      <div className="w-full bg-white pt-6 pb-12 px-4 border-t border-gray-100">
        <div className="mb-5 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Proses Produksi</h2>
            <p className="text-xs text-slate-500 mt-0.5">Lihat kualiti cetakan & kemasan jersi anda dihasilkan</p>
          </div>
        </div>

        {/* Horizontal Scroll Container (Swipeable Reel) */}
        <div 
          className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-pl-4 scroll-pr-4 scrollbar-none no-scrollbar" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {PRODUCTION_VIDEOS.map((video) => (
            /* CARD CONTAINER - Clean Rounded 28px dengan Bayang Lembut */
            <div 
              key={video.id}
              className="relative shrink-0 w-[72vw] max-w-[270px] aspect-[9/15] rounded-[28px] overflow-hidden bg-slate-900 snap-center shadow-lg shadow-slate-900/10 border border-slate-200/80 transition-transform active:scale-[0.98]"
            >
              {activeVideo === video.id ? (
                /* KONDISI 1: VIDEO SEDANG DIPUTAR - Iframe menutupi seluruh card */
                <iframe 
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&controls=1&modestbranding=1&rel=0&playsinline=1`} 
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                /* KONDISI 2: THUMBNAIL CERAH & INTERAKTIF */
                <div 
                  className="relative w-full h-full cursor-pointer group"
                  onClick={() => setActiveVideo(video.id)}
                >
                  {/* Gambar Sampul (100% Cerah & Berdefinisi Tinggi) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" 
                  />

                  {/* Gradient Halus Khusus Hanya di Bahagian Bawah (Kekalkan Bahagian Atas Cerah Bersih) */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                  {/* Tombol Play Besar Asli di Tengah (Glassmorphism & Animasi Pulsa) */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="relative flex items-center justify-center">
                      {/* Gelombang Pulsa Radar Lembut */}
                      <span className="absolute w-20 h-20 rounded-full bg-white/30 animate-play-pulse pointer-events-none" />
                      <span className="absolute w-24 h-24 rounded-full bg-blue-500/25 animate-play-pulse [animation-delay:0.8s] pointer-events-none" />

                      {/* Butang Utama Play Besar Asli */}
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white/35 group-hover:bg-[#0052FF] backdrop-blur-xl border border-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110">
                        <Play className="w-7 h-7 sm:w-8 sm:h-8 ml-1 fill-white text-white drop-shadow-md transition-transform group-hover:scale-105" />
                      </div>
                    </div>
                  </div>

                  {/* Teks di Bahagian Bawah dengan Tipografi Kemas */}
                  <div className="absolute inset-x-0 bottom-0 p-4 pb-5 z-10">
                    <span className="bg-[#0052FF] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider mb-1.5 inline-block shadow-sm">
                      {video.category}
                    </span>
                    <h3 className="text-white font-bold text-[15px] sm:text-[16px] leading-snug drop-shadow-md">
                      {video.title}
                    </h3>
                    <p className="text-white/80 text-[11px] font-medium mt-1 flex items-center gap-1 group-hover:text-white transition-colors">
                      <span>Tonton rakaman</span>
                      <span className="text-[12px] group-hover:translate-x-0.5 transition-transform">→</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 3.5: HASIL PRODUKSI KILANG (Clean, Bright & Royal Blue Brand Identity)
         ========================================================================= */}
      <div className="w-full bg-[#F8FAFC] pt-10 pb-12 px-4 border-t border-slate-200/70">
        <div className="mb-5 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hasil Produksi Kilang</h2>
            <p className="text-xs text-slate-500 mt-0.5">Koleksi gambar sebenar tempahan jersi & pakaian siap</p>
          </div>

          {/* Quick Counter (Royal Blue Accent) */}
          <span className="text-[11px] font-bold text-[#0052FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100/80">
            {activeGalleryIndex + 1} / {PRODUCTION_GALLERY.length}
          </span>
        </div>

        {/* Horizontal Auto-Swap Carousel Container */}
        <div 
          ref={galleryScrollRef}
          onScroll={handleGalleryScroll}
          onMouseEnter={() => setIsGalleryPaused(true)}
          onMouseLeave={() => setIsGalleryPaused(false)}
          onTouchStart={() => setIsGalleryPaused(true)}
          onTouchEnd={() => setIsGalleryPaused(false)}
          className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-pl-4 scroll-pr-4 scrollbar-none no-scrollbar" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {PRODUCTION_GALLERY.map((item, idx) => {
            const isActive = idx === activeGalleryIndex;
            return (
              <div 
                key={item.id}
                onClick={() => scrollToGallery(idx)}
                className={`shrink-0 w-[82vw] max-w-[320px] bg-white rounded-3xl overflow-hidden snap-center border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isActive 
                    ? 'border-[#0052FF] shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20' 
                    : 'border-slate-200/80 shadow-sm opacity-90'
                }`}
              >
                {/* 100% Bright, Crisp Photo (Natural Colors, No Heavy Dark Tint) */}
                <div className="relative w-full aspect-[4/3.2] bg-slate-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/95 backdrop-blur-md text-[#0052FF] font-bold text-[10px] px-2.5 py-1 rounded-full shadow-xs border border-blue-100/60">
                      {item.tag}
                    </span>
                  </div>
                </div>

                {/* Clean, Minimal Card Details Below Photo (Zero Pollution) */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <h3 className="font-bold text-[15px] text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-[12px] text-slate-500 mt-1 line-clamp-1">
                      {item.fabric}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">
                      {item.client}
                    </span>
                    <a
                      href={`https://wa.me/60148599138?text=Hai%20SFV%20Apparel,%20saya%20berminat%20dengan%20hasil%20produksi%20*${encodeURIComponent(item.title)}*`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#0052FF] hover:text-blue-700 transition-colors"
                    >
                      <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>Tempah Seperti Ini</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Indicator Dots (Royal Blue Accent) */}
        <div className="flex justify-center items-center gap-1.5 pt-2">
          {PRODUCTION_GALLERY.map((_, idx) => {
            const isActive = idx === activeGalleryIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToGallery(idx)}
                aria-label={`Lihat hasil produksi ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'w-6 bg-[#0052FF]' 
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: TESTIMONI / REVIEWS (Auto-Swap Carousel & Interaktif)
         ========================================================================= */}
      <div className="w-full bg-[#F2F2F7] pt-10 pb-14 px-4 border-t border-gray-200/60">
        <div className="mb-5 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Apa Kata Mereka</h2>
            <p className="text-xs text-slate-500 mt-0.5">Ribuan pelanggan telah mempercayai kualiti jersi kami</p>
          </div>

          {/* Quick Counter */}
          <span className="text-[11px] font-bold text-slate-400 bg-white px-2.5 py-1 rounded-full shadow-xs border border-black/[0.04]">
            {activeTestiIndex + 1} / {TESTIMONIALS.length}
          </span>
        </div>

        {/* Horizontal Swipe & Auto-Swap Container */}
        <div 
          ref={testimonialScrollRef}
          onScroll={handleTestiScroll}
          onMouseEnter={() => setIsTestiPaused(true)}
          onMouseLeave={() => setIsTestiPaused(false)}
          onTouchStart={() => setIsTestiPaused(true)}
          onTouchEnd={() => setIsTestiPaused(false)}
          className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-pl-4 scroll-pr-4 scrollbar-none no-scrollbar" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {TESTIMONIALS.map((t, idx) => {
            const isActive = idx === activeTestiIndex;
            return (
              <div 
                key={t.id}
                onClick={() => scrollToTestimonial(idx)}
                className={`shrink-0 w-[80vw] max-w-[320px] bg-white rounded-[24px] p-5 snap-center border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  isActive 
                    ? 'border-blue-200 shadow-md shadow-blue-900/5 ring-1 ring-blue-500/20' 
                    : 'border-gray-100 shadow-sm opacity-90'
                }`}
              >
                {/* Header Card: Avatar, Nama, dan Logo Platform */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar Pengguna */}
                    <div className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center ${t.avatarText} font-bold text-base shrink-0 shadow-xs`}>
                      {t.initial}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-[14px] leading-tight">{t.name}</h4>
                      <p className="text-[11.5px] text-slate-500 mt-0.5">{t.location}</p>
                    </div>
                  </div>
                  
                  {/* Ikon Platform (Format Warna Asli) */}
                  <div className="w-5 h-5 shrink-0">
                    {renderPlatformIcon(t.platform)}
                  </div>
                </div>

                {/* Bintang Penilaian */}
                <div className="flex gap-1 mb-2.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Teks Ulasan */}
                <p className="text-[12.5px] text-slate-700 leading-relaxed font-normal">
                  {t.review}
                </p>
              </div>
            );
          })}
        </div>

        {/* Interactive Pagination Indicator Dots */}
        <div className="flex justify-center items-center gap-1.5 pt-3">
          {TESTIMONIALS.map((_, idx) => {
            const isActive = idx === activeTestiIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToTestimonial(idx)}
                aria-label={`Lihat testimoni ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'w-6 bg-[#0052FF]' 
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: FOOTER INDUSTRI STANDARD (Brand Sportswear Standard Layout)
         ========================================================================= */}
      <footer className="w-full bg-[#F4F4F7] pt-10 pb-12 px-5 border-t border-gray-200/80 select-none space-y-7">
        {/* 1. Header: Brand Lockup & Social Media Micro Icons */}
        <div className="flex flex-col space-y-3.5">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5 max-w-[240px]">
              <div className="inline-flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="SFV Logo" className="h-5 w-5 object-contain shrink-0" />
                <div className="flex items-baseline tracking-tight">
                  <span className="font-extrabold text-[16px] text-[#0052FF]">SFV</span>
                  <span className="font-semibold text-[12px] tracking-[0.2em] text-slate-900 ml-1.5 uppercase">APPAREL</span>
                </div>
              </div>
              <p className="text-[11.5px] text-slate-500 leading-snug">
                Pakar pembuatan jersi sublimasi penuh, cetakan DTF & sulaman pakaian kustom berkualiti tinggi di Malaysia.
              </p>
              <p className="text-[10.5px] text-slate-400 leading-snug">
                sfvapparel.my dimiliki & diuruskan oleh <span className="font-medium text-slate-600">SFV Ventures Marketing</span> (No. Pendaftaran Syarikat: XXXXXXX-X).
              </p>
            </div>

            {/* Micro Social Icons (Top Right) */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <a href="https://www.facebook.com/sfvapparel/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-7 h-7 rounded-full bg-white shadow-xs border border-gray-200/60 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors active:scale-90">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com/sfv.apparel/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-7 h-7 rounded-full bg-white shadow-xs border border-gray-200/60 flex items-center justify-center text-slate-600 hover:text-pink-600 transition-colors active:scale-90">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://www.tiktok.com/@sfvapparel" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-7 h-7 rounded-full bg-white shadow-xs border border-gray-200/60 flex items-center justify-center text-slate-600 hover:text-black transition-colors active:scale-90">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.89 2.88 2.89 2.89 0 0 1-2.89-2.88 2.89 2.89 0 0 1 2.89-2.88c.49 0 .94.12 1.34.34V9.75a6.22 6.22 0 0 0-1.34-.15A6.24 6.24 0 0 0 3.24 15.83a6.24 6.24 0 0 0 6.24-6.23 6.24 6.24 0 0 0 6.24-6.23V9a8.16 8.16 0 0 0 4.77 1.52v-3.35a4.83 4.83 0 0 1-.9-.48z"/></svg>
              </a>
              <a href="https://t.me/sfvapparelcatalog" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="w-7 h-7 rounded-full bg-white shadow-xs border border-gray-200/60 flex items-center justify-center text-slate-600 hover:text-sky-500 transition-colors active:scale-90">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z"/></svg>
              </a>
              <a href="https://wa.me/60148599138" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-7 h-7 rounded-full bg-white shadow-xs border border-gray-200/60 flex items-center justify-center text-slate-600 hover:text-emerald-600 transition-colors active:scale-90">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.122.553 4.179 1.603 5.996L0 24l6.167-1.617a12.01 12.01 0 0 0 5.864 1.516h.005c6.645 0 12.03-5.385 12.03-12.031A12.03 12.03 0 0 0 12.031 0zm0 22.028h-.004a9.99 9.99 0 0 1-5.093-1.392l-.365-.217-3.784.992 1.01-3.69-.237-.378a9.97 9.97 0 0 1-1.529-5.312C2.029 6.502 6.506 2.025 12.031 2.025c2.671 0 5.182 1.04 7.07 2.928a9.94 9.94 0 0 1 2.93 7.078c0 5.526-4.477 9.997-10 9.997zm5.485-7.496c-.3-.15-1.776-.877-2.051-.977-.276-.1-.476-.15-.676.15-.2.3-.776.977-.951 1.177-.175.2-.35.226-.651.075s-1.27-.468-2.42-1.493c-.895-.798-1.5-1.784-1.675-2.084-.175-.3-.019-.463.131-.612.135-.135.3-.35.45-.526.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.63-.926-2.232-.244-.587-.492-.507-.676-.516l-.576-.01c-.2 0-.525.075-.8.375s-1.05 1.026-1.05 2.502 1.076 2.903 1.226 3.103c.15.2 2.117 3.232 5.13 4.533.717.31 1.277.495 1.713.633.72.229 1.375.197 1.894.119.579-.087 1.776-.726 2.026-1.427.25-.701.25-1.302.175-1.427-.075-.125-.275-.2-.575-.35z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* 2. Structured Link Columns (2-Column Standard E-commerce Grid) */}
        <div className="grid grid-cols-2 gap-6 pt-5 border-t border-gray-200/70 text-xs">
          {/* Column 1: Perkhidmatan */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
              Perkhidmatan
            </h4>
            <ul className="space-y-2 text-slate-600 text-[12px]">
              <li>
                <Link href="/catalog?type=sublimation" className="hover:text-blue-600 transition-colors block">
                  Jersi Sublimasi Penuh
                </Link>
              </li>
              <li>
                <Link href="/catalog?type=dtf" className="hover:text-blue-600 transition-colors block">
                  Cetakan DTF Premium
                </Link>
              </li>
              <li>
                <Link href="/catalog?type=embroidery" className="hover:text-blue-600 transition-colors block">
                  Sulaman Berkomputer
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-blue-600 transition-colors block">
                  Semak Status Pesanan
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Polisi & Bantuan */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
              Polisi & Bantuan
            </h4>
            <ul className="space-y-2 text-slate-600 text-[12px]">
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('privacy')}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Dasar Privasi (Privacy)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('terms')}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Terma & Syarat (Terms)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('warranty')}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Jaminan & Pemulangan
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('shipping')}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Polisi Penghantaran
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Secure Payment Accepted Badges */}
        <div className="pt-5 border-t border-gray-200/70 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0052FF] shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Jaminan Pembayaran Selamat
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/payments/logobaru/FPX%20Logo%20Vector.svg" alt="FPX Online Banking" className="h-[52px] w-auto object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/payments/logobaru/duitnow.svg" alt="DuitNow QR" className="h-[28px] w-auto object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/payments/logobaru/Touch_'n_Go_eWallet_logo.svg" alt="Touch 'n Go eWallet" className="h-[26px] w-auto object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/payments/logobaru/maybank-vector-logo.svg" alt="Maybank" className="h-[50px] w-auto object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/payments/logobaru/Visa_Inc._logo_(2021–present).svg" alt="Visa" className="h-[16px] w-auto object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/payments/logobaru/Mastercard-logo.svg" alt="Mastercard" className="h-[24px] w-auto object-contain" />
          </div>
        </div>

        {/* 4. Disclaimer Section (Micro Legal Print) */}
        <div className="pt-4 border-t border-gray-200/70 space-y-1.5">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
            Penafian Hak Cipta & Maklumat (Disclaimer)
          </p>
          <p className="text-[9.5px] text-slate-400 leading-relaxed">
            Logo dan beberapa visual di laman web ini adalah hak cipta oleh pemiliknya masing-masing. Kami tidak menuntut atau mengeluarkan hak cipta bagi pihak atau mewakili pemilik masing-masing. Maklumat yang terkandung di laman web ini adalah untuk tujuan maklumat am sahaja. Maklumat ini disediakan untuk memastikan maklumat terkini dan betul sebanyak mungkin. Apabila anda melawati atau berinteraksi dengan tapak, perkhidmatan, aplikasi, alatan atau pemesejan kami, kami atau pembekal perkhidmatan kami yang diberi kuasa boleh menggunakan cookies, web beacons dan teknologi lain yang serupa untuk menyimpan maklumat untuk membantu memberikan anda pengalaman yang lebih baik, lebih pantas dan selamat dan untuk tujuan pengiklanan.
          </p>
        </div>

        {/* 5. Bottom Legal Bar (Clean Centered Layout for Mobile) */}
        <div className="pt-4 border-t border-gray-200/70 flex flex-col items-center justify-center text-center space-y-1">
          <p className="text-[11px] font-medium text-slate-600">
            © 2026 SFV APPAREL. Hak Cipta Terpelihara.
          </p>
          <a 
            href="https://ayezz.dev/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-[#0052FF] transition-colors inline-flex items-center gap-1 text-[10.5px]"
          >
            <span>Rekaan oleh</span>
            <span className="font-semibold text-slate-600 hover:text-[#0052FF]">AYEZZ GLOBAL ↗</span>
          </a>
        </div>
      </footer>

      {/* =========================================================================
          5. SWIPEABLE iOS BOTTOM SHEET: LEGAL & POLICY (Sticky Docked Action)
         ========================================================================= */}
      <SwipeableBottomSheet
        isOpen={isPolicySheetOpen}
        onClose={() => setIsPolicySheetOpen(false)}
        maxHeight="max-h-[88vh]"
        badge={
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {selectedPolicy.badge}
          </span>
        }
        footer={
          <a
            href="https://wa.me/60148599138?text=Hai%20SFV,%20saya%20ada%20pertanyaan%20tentang%20polisi"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#0052FF] text-white font-semibold py-3.5 rounded-xl text-center active:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 text-xs"
          >
            <span>Hubungi Khidmat Pelanggan →</span>
          </a>
        }
      >
        <h2 className="text-xl font-bold text-gray-900 leading-snug">
          {selectedPolicy.title}
        </h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          {selectedPolicy.description}
        </p>

        <div className="bg-gray-50 p-4 rounded-2xl space-y-4 mt-3">
          {selectedPolicy.sections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <h3 className="text-xs font-bold text-gray-900">{sec.heading}</h3>
              <p className="text-[11.5px] text-gray-600 leading-relaxed">{sec.text}</p>
            </div>
          ))}
        </div>
      </SwipeableBottomSheet>

      {/* =========================================================================
          6. SWIPEABLE iOS BOTTOM SHEET: SERVICE DETAIL (Sticky Docked Action)
         ========================================================================= */}
      <SwipeableBottomSheet
        isOpen={isProductSheetOpen}
        onClose={() => setIsProductSheetOpen(false)}
        maxHeight="max-h-[88vh]"
        badge={
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {selectedProduct.category}
          </span>
        }
        footer={
          <Link
            href={selectedProduct.href}
            onClick={() => setIsProductSheetOpen(false)}
            className="w-full bg-[#0052FF] text-white font-semibold py-3.5 rounded-xl text-center active:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-md shadow-blue-500/25 text-xs"
          >
            <span>Mula Tempah {selectedProduct.title} →</span>
          </Link>
        }
      >
        <h2 className="text-xl font-bold text-gray-900 leading-snug">
          {selectedProduct.headline}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          {selectedProduct.highlight} • <span className="text-[#0052FF] font-bold">{selectedProduct.price}</span>
        </p>

        {/* Box Rincian */}
        <div className="bg-gray-50 p-4 rounded-2xl space-y-2.5 mt-3">
          {selectedProduct.details.map((detail, idx) => (
            <div key={idx} className="space-y-0.5">
              <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0052FF] shrink-0" />
                <span>{detail.title}</span>
              </p>
              <p className="text-[11.5px] text-gray-600 pl-5 leading-relaxed">
                {detail.description}
              </p>
            </div>
          ))}
        </div>
      </SwipeableBottomSheet>

      {/* =========================================================================
          7. SWIPEABLE iOS BOTTOM SHEET: ORDER STEP DETAIL (Sticky Docked Action)
         ========================================================================= */}
      <SwipeableBottomSheet
        isOpen={isStepSheetOpen}
        onClose={() => setIsStepSheetOpen(false)}
        maxHeight="max-h-[88vh]"
        badge={
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Langkah {selectedStep.step}
          </span>
        }
        footer={
          <Link
            href="/catalog"
            onClick={() => setIsStepSheetOpen(false)}
            className="w-full bg-[#0052FF] text-white font-semibold py-3.5 rounded-xl text-center active:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 text-xs"
          >
            <span>Terus ke Katalog Templat →</span>
          </Link>
        }
      >
        <h2 className="text-lg font-bold text-gray-900 leading-snug">
          {selectedStep.detailTitle}
        </h2>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          {selectedStep.detailDesc}
        </p>

        {/* Box Rincian */}
        <div className="bg-gray-50 p-4 rounded-2xl space-y-2 mt-3">
          <p className="text-xs font-bold text-gray-900 mb-2.5">Perincian Penting:</p>
          <ul className="space-y-2">
            {selectedStep.points.map((pt, idx) => (
              <li key={idx} className="text-[12px] text-gray-700 flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0052FF] mt-1.5 shrink-0" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      </SwipeableBottomSheet>
    </div>
  );
}

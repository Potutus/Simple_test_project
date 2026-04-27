// а это уже скорее на память
const FileMimeType = {
	'text/html': ['html', 'htm', 'shtml'],
	'text/css': ['css'],
	'text/xml': ['xml'],
	'image/gif': ['gif'],
	'image/jpeg': ['jpeg', 'jpg'],
	'application/x-javascript': ['js'],
	'application/atom+xml': ['atom'],
	'application/rss+xml': ['rss'],

	'text/mathml': ['mml'],
	'text/plain': ['txt'],
	'text/vnd.sun.j2me.app-descriptor': ['jad'],
	'text/vnd.wap.wml': ['wml'],
	'text/x-component': ['htc'],

	'image/png': ['png'],
	'image/tiff': ['tif', 'tiff'],
	'image/vnd.wap.wbmp': ['wbmp'],
	'image/x-icon': ['ico'],
	'image/x-jng': ['jng'],
	'image/x-ms-bmp': ['bmp'],
	'image/svg+xml': ['svg'],
	'image/webp': ['webp'],

	'application/java-archive': ['jar', 'war', 'ear'],
	'application/mac-binhex40': ['hqx'],
	'application/msword': ['doc'],
	'application/pdf': ['pdf'],
	'application/postscript': ['ps', 'eps', 'ai'],
	'application/rtf': ['rtf'],
	'application/vnd.ms-excel': ['xls'],
	'application/vnd.ms-powerpoint': ['ppt'],
	'application/vnd.wap.wmlc': ['wmlc'],
	'application/vnd.google-earth.kml+xml': ['kml'],
	'application/vnd.google-earth.kmz': ['kmz'],
	'application/x-7z-compressed': ['7z'],
	'application/x-cocoa': ['cco'],
	'application/x-java-archive-diff': ['jardiff'],
	'application/x-java-jnlp-file': ['jnlp'],
	'application/x-makeself': ['run'],
	'application/x-perl': ['pl', 'pm'],
	'application/x-pilot': ['prc', 'pdb'],
	'application/x-rar-compressed': ['rar'],
	'application/x-redhat-package-manager': ['rpm'],
	'application/x-sea': ['sea'],
	'application/x-shockwave-flash': ['swf'],
	'application/x-stuffit': ['sit'],
	'application/x-tcl': ['tcl', 'tk'],
	'application/x-x509-ca-cert': ['der', 'pem', 'crt'],
	'application/x-xpinstall': ['xpi'],
	'application/xhtml+xml': ['xhtml'],
	'application/zip': ['zip'],

	'application/octet-stream': [
		'bin',
		'exe',
		'dll',
		'deb',
		'dmg',
		'eot',
		'iso',
		'img',
		'msi',
		'msp',
		'msm',
	],
	'audio/midi': ['mid', 'midi', 'kar'],
	'audio/mpeg': ['mp3'],
	'audio/ogg': ['ogg'],
	'audio/x-realaudio': ['ra'],
	'video/3gpp': ['3gpp', '3gp'],
	'video/mpeg': ['mpeg', 'mpg'],
	'video/quicktime': ['mov'],
	'video/x-flv': ['flv'],
	'video/x-mng': ['mng'],
	'video/x-ms-asf': ['asx', 'asf'],
	'video/x-ms-wmv': ['wmv'],
	'video/x-msvideo': ['avi'],
	'video/mp4': ['m4v', 'mp4'],
}
// ---

const magicNumbers = {
	// --- IMAGES ---
	'image/jpeg': [
		Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
		Buffer.from([0xff, 0xd8, 0xff, 0xe1]),
		Buffer.from([0xff, 0xd8, 0xff, 0xe8]),
	],
	'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
	'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38])],
	'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])],
	'image/jfif': [Buffer.from([0xff, 0xd8, 0xff, 0xe0])],
	'image/bmp': [Buffer.from([0x42, 0x4d])],

	// --- VIDEO ---
	'video/mp4': [
		Buffer.from([0x00, 0x00, 0x00, 0x18]),
		Buffer.from([0x00, 0x00, 0x00, 0x20]),
		Buffer.from([0x66, 0x74, 0x79, 0x70]), // ftyp
	],
	'video/webm': [Buffer.from([0x1a, 0x45, 0xdf, 0xa3])],
	'video/ogg': [Buffer.from([0x4f, 0x67, 0x67, 0x53])],

	// --- AUDIO ---
	'audio/mpeg': [
		Buffer.from([0xff, 0xfb]),
		Buffer.from([0xff, 0xf3]),
		Buffer.from([0xff, 0xf2]),
	],
	'audio/ogg': [Buffer.from([0x4f, 0x67, 0x67, 0x53])],
	'audio/wav': [Buffer.from([0x52, 0x49, 0x46, 0x46])],
	'audio/flac': [Buffer.from([0x66, 0x4c, 0x61, 0x43])],

	// --- DOCUMENTS ---
	'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])],
	'text/plain': [Buffer.from([0xef, 0xbb, 0xbf])], // UTF-8 BOM
	'application/msword': [Buffer.from([0xd0, 0xcf, 0x11, 0xe0])], // DOC (OLE)
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
		// DOCX
		Buffer.from([0x50, 0x4b, 0x03, 0x04]), // ZIP
	],

	// --- EXECUTABLES / ARCHIVES (для блокировки или строгого контроля) ---
	// ВНИМАНИЕ: Многие MIME-типы здесь имеют общие сигнатуры (например, ZIP),
	// поэтому их валидация должна опираться на MIME-тип, определенный библиотекой file-type.

	// Исполняемые файлы
	'application/x-msdownload': [Buffer.from([0x4d, 0x5a])], // MZ (EXE/DLL - заголовок DOS)
	'application/x-executable': [Buffer.from([0x7f, 0x45, 0x4c, 0x46])], // ELF (Linux/Unix executable)

	// Архивы (часто содержат вредоносные программы)
	'application/zip': [Buffer.from([0x50, 0x4b, 0x03, 0x04])],
	'application/x-rar-compressed': [
		Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00]),
	],
	'application/x-tar': [Buffer.from([0x75, 0x73, 0x74, 0x61, 0x72])], // ustar

	// Другие типы документов/контейнеров
	'application/vnd.ms-excel': [Buffer.from([0xd0, 0xcf, 0x11, 0xe0])], // XLS (OLE)
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
		// XLSX (ZIP-based)
		Buffer.from([0x50, 0x4b, 0x03, 0x04]), // ZIP
	],

	// Файлы JavaScript (для строгой фильтрации, если вы не разрешаете их)
	'text/javascript': [Buffer.from([0x2f, 0x2f]), Buffer.from([0x2f, 0x2a])], // // или /*

	// Универсальный бинарный поток (часто используется для неизвестных исполняемых файлов)
	'application/octet-stream': [], // Без специфической сигнатуры, MIME определяется, если ничего не найдено
}

const accessedExt = {
	avatar: ['jpg', 'jpeg', 'webm', 'webp', 'png', 'jfif'] as const,
	media: ['mp4', 'jpg', 'jpeg', 'webm', 'webp', 'png', 'jfif', 'gif'] as const,
	docs: ['pdf', 'txt', 'word'] as const,
	fsNode: ['any'],
}

export { magicNumbers, accessedExt }

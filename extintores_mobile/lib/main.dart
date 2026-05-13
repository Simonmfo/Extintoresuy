
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:signature/signature.dart';
import 'dart:convert';
import 'package:intl/intl.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Supabase.initialize(
    url: 'https://nannsywlxbomgifvlkqz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hbm5zeXdseGJvbWdpZnZsa3F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDgzNTksImV4cCI6MjA4NjIyNDM1OX0.9OzEtxjnGkvhKP7lE-TDKRut50pVJcOo10b1k9AV0Dc',
  );

  runApp(const ExtintoresApp());
}

class ExtintoresApp extends StatelessWidget {
  const ExtintoresApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ExtintoresUY Técnico',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF13EC5B),
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF13EC5B),
          secondary: Color(0xFF13EC5B),
          surface: Color(0xFF1E293B),
        ),
      ),
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthState>(
      stream: Supabase.instance.client.auth.onAuthStateChange,
      builder: (context, snapshot) {
        final session = Supabase.instance.client.auth.currentSession;
        if (session != null) {
          return const MainLayout();
        }
        return const LoginScreen();
      },
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;

  Future<void> _signIn() async {
    setState(() => _loading = true);
    try {
      await Supabase.instance.client.auth.signInWithPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Image.asset('assets/icon.png', height: 120),
              const SizedBox(height: 24),
              Text('ExtintoresUY', textAlign: TextAlign.center, style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white)),
              Text('PLATAFORMA NATIVA', textAlign: TextAlign.center, style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF13EC5B), letterSpacing: 2)),
              const SizedBox(height: 48),
              TextField(
                controller: _emailController,
                decoration: InputDecoration(
                  hintText: 'Email Corporativo',
                  prefixIcon: const Icon(Icons.mail_outline),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.05),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  hintText: 'Contraseña',
                  prefixIcon: const Icon(Icons.lock_outline),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.05),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _loading ? null : _signIn,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF13EC5B),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: _loading 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Text('ACCEDER AL SISTEMA', style: TextStyle(fontWeight: FontWeight.w900)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _currentIndex = 0;
  final List<Map<String, dynamic>> _pendingInspections = [];
  
  void _addInspection(Map<String, dynamic> inspection) {
    setState(() {
      _pendingInspections.add(inspection);
      _currentIndex = 1; 
    });
  }

  Future<void> _finalizeAll(String signerName, String signerDoc, String signatureBase64) async {
    final client = Supabase.instance.client;
    final user = client.auth.currentUser;
    
    if (user == null) return;

    try {
      showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));

      for (var insp in _pendingInspections) {
        // 1. Create inspection record
        await client.from('inspections').insert({
          'asset_id': insp['assetId'],
          'status': 'completed',
          'result': 'pass', // Default to pass for this simplified flow
          'notes': jsonEncode(insp['checklist']),
          'date': DateTime.now().toIso8601String(),
          'inspector_id': user.id,
          'signer_name': signerName,
          'signer_document': signerDoc,
          'signature_url': signatureBase64 // Storing base64 for now as requested for simplicity
        });

        // 2. Update asset status
        final nextDate = DateTime.now().add(const Duration(days: 30));
        await client.from('assets').update({
          'status': 'ok',
          'last_inspection': DateTime.now().toIso8601String(),
          'next_inspection_date': DateFormat('yyyy-MM-dd').format(nextDate),
        }).eq('id', insp['assetId']);
      }

      Navigator.pop(context); // Close loading
      setState(() => _pendingInspections.clear());
      setState(() => _currentIndex = 0);
      
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Inspección guardada en base de datos correctamente.')));
    } catch (e) {
      Navigator.pop(context); // Close loading
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error al guardar: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> screens = [
      AssignedTasksScreen(onStartInspection: (id) => _navigateToInspection(id)),
      SessionScreen(
        inspections: _pendingInspections, 
        onRemove: (idx) => setState(() => _pendingInspections.removeAt(idx)),
        onFinalize: () => _navigateToValidation(),
      ),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: screens[_currentIndex],
      floatingActionButton: _currentIndex == 0 ? FloatingActionButton(
        onPressed: () => _openScanner(),
        backgroundColor: const Color(0xFF13EC5B),
        child: const Icon(Icons.qr_code_scanner, color: Colors.black),
      ) : null,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: Colors.white.withOpacity(0.05))),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (idx) => setState(() => _currentIndex = idx),
          backgroundColor: const Color(0xFF0F172A),
          selectedItemColor: const Color(0xFF13EC5B),
          unselectedItemColor: Colors.grey,
          showUnselectedLabels: false,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.assignment), label: 'Tareas'),
            BottomNavigationBarItem(icon: Icon(Icons.rule), label: 'Sesión'),
            BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Perfil'),
          ],
        ),
      ),
    );
  }

  void _openScanner() {
    Navigator.push(context, MaterialPageRoute(builder: (context) => ScannerScreen(
      onScan: (id) {
        Navigator.pop(context);
        _navigateToInspection(id);
      },
    )));
  }

  void _navigateToInspection(String assetId) {
    Navigator.push(context, MaterialPageRoute(builder: (context) => InspectionFormScreen(
      assetId: assetId,
      onSave: (data) => _addInspection(data),
    )));
  }

  void _navigateToValidation() {
    Navigator.push(context, MaterialPageRoute(builder: (context) => ValidationScreen(
      count: _pendingInspections.length,
      onConfirm: (name, doc, signature) => _finalizeAll(name, doc, signature),
    )));
  }
}

class AssignedTasksScreen extends StatelessWidget {
  final Function(String) onStartInspection;
  const AssignedTasksScreen({super.key, required this.onStartInspection});

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;
    
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 40),
          Text('Mis Tareas', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900)),
          const SizedBox(height: 24),
          Expanded(
            child: FutureBuilder(
              future: Supabase.instance.client
                  .from('assets')
                  .select('*')
                  .eq('assigned_technician_id', user?.id ?? '')
                  .eq('status', 'pending'),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                
                final data = snapshot.data as List<dynamic>? ?? [];
                
                if (data.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.task_alt, size: 64, color: Colors.white.withOpacity(0.1)),
                        const SizedBox(height: 16),
                        const Text('¡Todo al día!', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                        const Text('No tienes inspecciones pendientes.', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  itemCount: data.length,
                  itemBuilder: (context, index) {
                    final asset = data[index];
                    return Card(
                      color: Colors.white.withOpacity(0.05),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        leading: const CircleAvatar(backgroundColor: Color(0xFF13EC5B), child: Icon(Icons.fire_extinguisher, color: Colors.black)),
                        title: Text(asset['name'] ?? 'Equipo #${asset['id']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('${asset['type'] ?? 'Extintor'} • Pendiente'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => onStartInspection(asset['id']),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class SessionScreen extends StatelessWidget {
  final List<Map<String, dynamic>> inspections;
  final Function(int) onRemove;
  final VoidCallback onFinalize;

  const SessionScreen({super.key, required this.inspections, required this.onRemove, required this.onFinalize});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 40),
          Text('Sesión Actual', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900)),
          const SizedBox(height: 24),
          if (inspections.isEmpty)
            const Expanded(child: Center(child: Text('Escanea un equipo para comenzar', style: TextStyle(color: Colors.grey)))),
          if (inspections.isNotEmpty)
            Expanded(
              child: ListView.builder(
                itemCount: inspections.length,
                itemBuilder: (context, index) => ListTile(
                  title: Text('Equipo ${inspections[index]['assetId']}'),
                  subtitle: const Text('Estado: LISTO PARA SUBIR', style: TextStyle(color: Color(0xFF13EC5B), fontSize: 12, fontWeight: FontWeight.bold)),
                  trailing: IconButton(icon: const Icon(Icons.delete, color: Colors.redAccent), onPressed: () => onRemove(index)),
                ),
              ),
            ),
          if (inspections.isNotEmpty)
            ElevatedButton(
              onPressed: onFinalize,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(60),
                backgroundColor: const Color(0xFF13EC5B),
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('FINALIZAR Y FIRMAR', style: TextStyle(fontWeight: FontWeight.w900)),
            ),
        ],
      ),
    );
  }
}

class ScannerScreen extends StatelessWidget {
  final Function(String) onScan;
  const ScannerScreen({super.key, required this.onScan});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Escanear QR')),
      body: MobileScanner(
        onDetect: (capture) {
          final List<Barcode> barcodes = capture.barcodes;
          for (final barcode in barcodes) {
            if (barcode.rawValue != null) {
              onScan(barcode.rawValue!);
              break;
            }
          }
        },
      ),
    );
  }
}

class InspectionFormScreen extends StatefulWidget {
  final String assetId;
  final Function(Map<String, dynamic>) onSave;
  const InspectionFormScreen({super.key, required this.assetId, required this.onSave});

  @override
  State<InspectionFormScreen> createState() => _InspectionFormScreenState();
}

class _InspectionFormScreenState extends State<InspectionFormScreen> {
  final Map<String, bool> _checklist = {
    'Manómetro OK': true,
    'Precinto Intacto': true,
    'Acceso Despejado': true,
    'Cartelería Visible': true,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Inspección ${widget.assetId}')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Expanded(
              child: ListView(
                children: _checklist.keys.map((key) => CheckboxListTile(
                  title: Text(key),
                  value: _checklist[key],
                  activeColor: const Color(0xFF13EC5B),
                  onChanged: (val) => setState(() => _checklist[key] = val!),
                )).toList(),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                widget.onSave({'assetId': widget.assetId, 'checklist': _checklist});
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(60),
                backgroundColor: const Color(0xFF13EC5B),
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('GUARDAR Y CONTINUAR', style: TextStyle(fontWeight: FontWeight.w900)),
            ),
          ],
        ),
      ),
    );
  }
}

class ValidationScreen extends StatefulWidget {
  final int count;
  final Function(String, String, String) onConfirm;
  const ValidationScreen({super.key, required this.count, required this.onConfirm});

  @override
  State<ValidationScreen> createState() => _ValidationScreenState();
}

class _ValidationScreenState extends State<ValidationScreen> {
  final _signatureController = SignatureController(penStrokeWidth: 5, penColor: Colors.white);
  final _nameController = TextEditingController();
  final _docController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cierre de Sesión')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Resumen: ${widget.count} equipos', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 24),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Nombre del Cliente'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _docController,
              decoration: const InputDecoration(labelText: 'Documento (C.I.)'),
            ),
            const SizedBox(height: 32),
            const Text('Firma del responsable', textAlign: TextAlign.center),
            const SizedBox(height: 12),
            Container(
              height: 250,
              decoration: BoxDecoration(border: Border.all(color: Colors.white.withOpacity(0.1)), borderRadius: BorderRadius.circular(20)),
              child: Signature(controller: _signatureController, backgroundColor: Colors.black12),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () async {
                final signature = await _signatureController.toPngBytes();
                if (signature != null && _nameController.text.isNotEmpty) {
                  widget.onConfirm(_nameController.text, _docController.text, base64Encode(signature));
                  if (mounted) Navigator.pop(context);
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Por favor completa el nombre y la firma.')));
                }
              },
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(60),
                backgroundColor: const Color(0xFF13EC5B),
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('SUBIR INSPECCIÓN A NUBE', style: TextStyle(fontWeight: FontWeight.w900)),
            ),
          ],
        ),
      ),
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircleAvatar(radius: 50, backgroundColor: const Color(0xFF13EC5B).withOpacity(0.1), child: const Icon(Icons.person, size: 50, color: Color(0xFF13EC5B))),
          const SizedBox(height: 16),
          Text(user?.email ?? 'Técnico', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('TECNICO DE CAMPO', style: TextStyle(color: Colors.grey, fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.bold)),
          const SizedBox(height: 48),
          TextButton(
            onPressed: () => Supabase.instance.client.auth.signOut(),
            child: const Text('CERRAR SESIÓN', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

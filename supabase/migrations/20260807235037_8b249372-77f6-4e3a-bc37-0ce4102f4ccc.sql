CREATE POLICY "Franchise docs readable" ON storage.objects FOR SELECT USING (bucket_id = 'franchise-documents');
CREATE POLICY "Franchise docs insertable" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'franchise-documents');
CREATE POLICY "Franchise docs updatable" ON storage.objects FOR UPDATE USING (bucket_id = 'franchise-documents') WITH CHECK (bucket_id = 'franchise-documents');
CREATE POLICY "Franchise docs deletable" ON storage.objects FOR DELETE USING (bucket_id = 'franchise-documents');
namespace SzakDolgozat.Api.Models
{
    public class EmailSettings
    {
        public string SendGridApiKey { get; set; }
        public string FromEmail { get; set; }
        public string FromName { get; set; }
        public bool Enabled { get; set; } = true;
    }
}